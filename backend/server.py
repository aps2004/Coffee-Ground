from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query, Header
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Object Storage Config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "uk-coffee-shops"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path, data, content_type):
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Password hashing
def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT tokens
def create_access_token(user_id, email, role="user"):
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id):
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth helpers
async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        # Check for session_token (Google Auth users)
        session_token = request.cookies.get("session_token")
        if not session_token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                session_token = auth_header[7:]
        if session_token:
            session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
            if not session:
                raise HTTPException(status_code=401, detail="Not authenticated")
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def require_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Pydantic models
class AdminLoginRequest(BaseModel):
    email: str
    password: str

class ShopCreate(BaseModel):
    name: str
    description: str
    detailed_description: str = ""
    city: str
    address: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    admin_rating: float = 0.0
    tags: List[str] = []
    playlist_url: str = ""

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    detailed_description: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    admin_rating: Optional[float] = None
    tags: Optional[List[str]] = None
    playlist_url: Optional[str] = None

class RatingCreate(BaseModel):
    rating: float
    comment: str = ""

# Create the main app
app = FastAPI()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ---- AUTH ENDPOINTS ----

@api_router.post("/auth/admin/login")
async def admin_login(req: AdminLoginRequest, response: Response):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email, "role": "admin"}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(user["user_id"], email, "admin")
    refresh_token = create_refresh_token(user["user_id"])
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    user_data = {k: v for k, v in user.items() if k != "password_hash"}
    return user_data

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    # Call Emergent Auth to get session data
    try:
        auth_resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        auth_resp.raise_for_status()
        auth_data = auth_resp.json()
    except Exception as e:
        logger.error(f"Emergent Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email", "").lower()
    name = auth_data.get("name", "")
    picture = auth_data.get("picture", "")
    session_token = auth_data.get("session_token", "")
    
    # Find or create user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Store session
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        max_age=604800, path="/"
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ---- SHOP ENDPOINTS ----

@api_router.get("/shops")
async def list_shops(sort_by: str = "rating", city: str = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    shops = await db.shops.find(query, {"_id": 0}).to_list(1000)
    
    # Calculate combined rating for sorting
    for shop in shops:
        admin_r = shop.get("admin_rating", 0)
        user_r = shop.get("avg_user_rating", 0)
        user_count = shop.get("rating_count", 0)
        if user_count > 0 and admin_r > 0:
            shop["combined_rating"] = (admin_r + user_r) / 2
        elif user_count > 0:
            shop["combined_rating"] = user_r
        else:
            shop["combined_rating"] = admin_r
    
    if sort_by == "rating":
        shops.sort(key=lambda x: x.get("combined_rating", 0), reverse=True)
    elif sort_by == "name":
        shops.sort(key=lambda x: x.get("name", ""))
    
    return shops

@api_router.get("/shops/map")
async def get_shops_for_map():
    shops = await db.shops.find(
        {"latitude": {"$ne": 0}, "longitude": {"$ne": 0}},
        {"_id": 0, "shop_id": 1, "name": 1, "city": 1, "latitude": 1, "longitude": 1, "admin_rating": 1, "avg_user_rating": 1, "rating_count": 1, "images": {"$slice": 1}, "description": 1}
    ).to_list(1000)
    return shops

@api_router.get("/shops/{shop_id}")
async def get_shop(shop_id: str):
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    # Get ratings
    ratings = await db.ratings.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    shop["ratings"] = ratings
    return shop

@api_router.post("/shops")
async def create_shop(request: Request):
    admin = await require_admin(request)
    body = await request.json()
    shop_data = ShopCreate(**body)
    
    shop_id = f"shop_{uuid.uuid4().hex[:12]}"
    doc = {
        "shop_id": shop_id,
        **shop_data.model_dump(),
        "images": [],
        "avg_user_rating": 0.0,
        "rating_count": 0,
        "created_by": admin["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shops.insert_one(doc)
    created = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    return created

@api_router.put("/shops/{shop_id}")
async def update_shop(shop_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    update_data = ShopUpdate(**body)
    
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.shops.update_one({"shop_id": shop_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    updated = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    return updated

@api_router.delete("/shops/{shop_id}")
async def delete_shop(shop_id: str, request: Request):
    await require_admin(request)
    result = await db.shops.delete_one({"shop_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"message": "Shop deleted"}

# ---- IMAGE ENDPOINTS ----

@api_router.post("/shops/{shop_id}/images")
async def upload_shop_image(shop_id: str, request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/shops/{shop_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    image_doc = {
        "image_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.shops.update_one(
        {"shop_id": shop_id},
        {"$push": {"images": image_doc}}
    )
    
    return image_doc

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=404, detail="File not found")

@api_router.delete("/shops/{shop_id}/images/{image_id}")
async def delete_shop_image(shop_id: str, image_id: str, request: Request):
    await require_admin(request)
    result = await db.shops.update_one(
        {"shop_id": shop_id},
        {"$pull": {"images": {"image_id": image_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image removed"}

# ---- RATING ENDPOINTS ----

@api_router.post("/shops/{shop_id}/rate")
async def rate_shop(shop_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    rating_data = RatingCreate(**body)
    
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Check if user already rated
    existing = await db.ratings.find_one({"shop_id": shop_id, "user_id": user["user_id"]})
    
    if existing:
        await db.ratings.update_one(
            {"shop_id": shop_id, "user_id": user["user_id"]},
            {"$set": {
                "rating": rating_data.rating,
                "comment": rating_data.comment,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        await db.ratings.insert_one({
            "rating_id": str(uuid.uuid4()),
            "shop_id": shop_id,
            "user_id": user["user_id"],
            "user_name": user.get("name", "Anonymous"),
            "user_picture": user.get("picture", ""),
            "rating": rating_data.rating,
            "comment": rating_data.comment,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Recalculate average
    pipeline = [
        {"$match": {"shop_id": shop_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.ratings.aggregate(pipeline).to_list(1)
    if result:
        avg_rating = round(result[0]["avg"], 1)
        count = result[0]["count"]
    else:
        avg_rating = 0.0
        count = 0
    
    await db.shops.update_one(
        {"shop_id": shop_id},
        {"$set": {"avg_user_rating": avg_rating, "rating_count": count}}
    )
    
    return {"avg_user_rating": avg_rating, "rating_count": count}

@api_router.get("/shops/{shop_id}/ratings")
async def get_shop_ratings(shop_id: str):
    ratings = await db.ratings.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return ratings

# ---- CONTACT ENDPOINTS ----

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str

@api_router.post("/contact")
async def submit_contact(req: ContactCreate):
    doc = {
        "contact_id": str(uuid.uuid4()),
        "name": req.name,
        "email": req.email,
        "message": req.message,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contacts.insert_one(doc)
    return {"message": "Thank you for your message. We'll get back to you soon."}

@api_router.get("/contact")
async def list_contacts(request: Request):
    await require_admin(request)
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return contacts

@api_router.put("/contact/{contact_id}/read")
async def mark_contact_read(contact_id: str, request: Request):
    await require_admin(request)
    await db.contacts.update_one({"contact_id": contact_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

# ---- ADMIN MANAGEMENT ENDPOINTS ----

class AdminCreate(BaseModel):
    login_name: str
    password: str
    name: str = ""

@api_router.get("/auth/admins")
async def list_admins(request: Request):
    await require_admin(request)
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "password_hash": 0}).to_list(50)
    return admins

@api_router.post("/auth/admins")
async def create_admin(request: Request):
    current_admin = await require_admin(request)
    body = await request.json()
    data = AdminCreate(**body)
    
    login_name = data.login_name.lower().strip()
    if not login_name or not data.password:
        raise HTTPException(status_code=400, detail="Login name and password are required")
    
    existing = await db.users.find_one({"email": login_name})
    if existing:
        raise HTTPException(status_code=409, detail="An admin with this login name already exists")
    
    user_id = f"admin_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(data.password)
    await db.users.insert_one({
        "user_id": user_id,
        "email": login_name,
        "password_hash": hashed,
        "name": data.name or login_name,
        "role": "admin",
        "created_by": current_admin["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    new_admin = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return new_admin

@api_router.delete("/auth/admins/{user_id}")
async def delete_admin(user_id: str, request: Request):
    current_admin = await require_admin(request)
    
    # Prevent self-deletion
    if current_admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    
    # Check if target is an admin
    target = await db.users.find_one({"user_id": user_id, "role": "admin"})
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Ensure at least one admin remains
    admin_count = await db.users.count_documents({"role": "admin"})
    if admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove the last admin")
    
    await db.users.delete_one({"user_id": user_id})
    return {"message": "Admin removed"}

# ---- SEED DATA ----

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "test123").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "12345")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        user_id = f"admin_{uuid.uuid4().hex[:12]}"
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")

async def seed_sample_shops():
    count = await db.shops.count_documents({})
    if count > 0:
        return
    
    sample_shops = [
        {
            "shop_id": f"shop_{uuid.uuid4().hex[:12]}",
            "name": "Monmouth Coffee Company",
            "description": "Iconic Borough Market roaster with single-origin beans and a legendary flat white. Queue outside is part of the charm.",
            "detailed_description": "Monmouth Coffee Company has been a cornerstone of London's specialty coffee scene since 1978. Located in the heart of Borough Market, this beloved institution sources single-origin beans directly from small farms across the globe. The aroma of freshly roasted coffee greets you well before you reach the door, and the queue that inevitably forms outside is a testament to the quality within.\n\nTheir flat white is legendary - a perfect balance of velvety microfoam and rich, complex espresso that showcases the bean's natural character. The interior is cozy and unpretentious, with wooden shelves stacked with bags of whole beans and the constant hum of the grinder providing the soundtrack.\n\nBeyond their exceptional coffee, Monmouth is known for their commitment to ethical sourcing and direct trade relationships. Each bag comes with detailed information about the farm, the altitude, and the processing method, reflecting their deep respect for the craft of coffee production.",
            "city": "London",
            "address": "27 Monmouth St, London WC2H 9EU",
            "latitude": 51.5144,
            "longitude": -0.1267,
            "admin_rating": 4.8,
            "images": [],
            "avg_user_rating": 0.0,
            "rating_count": 0,
            "tags": ["specialty", "single-origin", "borough-market"],
            "playlist_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DXbm7HUcNMfjs?utm_source=generator&theme=0",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "shop_id": f"shop_{uuid.uuid4().hex[:12]}",
            "name": "Takk Coffee House",
            "description": "Nordic-inspired Manchester gem serving exceptional pour-overs in a stripped-back Scandinavian space. A Northern Quarter essential.",
            "detailed_description": "Takk, meaning 'thanks' in Icelandic, brings a slice of Nordic coffee culture to Manchester's vibrant Northern Quarter. This stripped-back, beautifully designed space celebrates simplicity in both its aesthetic and its approach to coffee.\n\nThe interior features raw concrete, reclaimed wood, and plenty of natural light - a perfect backdrop for their meticulously prepared drinks. Their pour-over selection rotates frequently, showcasing light, fruity roasts that highlight the natural sweetness of high-quality beans.\n\nThe food menu complements the coffee perfectly, with Scandinavian-inspired open sandwiches and pastries that are as photogenic as they are delicious. Takk has become more than just a coffee shop - it's a community hub where creative minds gather, freelancers find their second office, and coffee lovers discover new flavor profiles they never knew existed.",
            "city": "Manchester",
            "address": "6 Tariff St, Manchester M1 2FF",
            "latitude": 53.4841,
            "longitude": -2.2345,
            "admin_rating": 4.6,
            "images": [],
            "avg_user_rating": 0.0,
            "rating_count": 0,
            "tags": ["nordic", "pour-over", "northern-quarter"],
            "playlist_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWYoYGBbGKurt?utm_source=generator&theme=0",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "shop_id": f"shop_{uuid.uuid4().hex[:12]}",
            "name": "Colonna & Smalls",
            "description": "Three-time UK Barista Champion's Bath cafe pushing boundaries with innovative brewing methods and world-class beans.",
            "detailed_description": "Founded by three-time UK Barista Champion Maxwell Colonna-Dashwood, Colonna & Smalls is where coffee science meets artistry. Nestled in the Georgian splendor of Bath, this cafe has earned a reputation as one of the finest specialty coffee destinations in the world.\n\nThe menu is refreshingly different, organized not by drink type but by flavor profile and intensity. This approach encourages exploration and helps newcomers to specialty coffee find their preferences without the intimidation of coffee jargon.\n\nEvery cup is brewed with precision - water temperature, grind size, and extraction time are all calibrated to bring out the best in each bean. The result is coffee that tells a story, from the misty highlands of Ethiopia to the volcanic slopes of Guatemala. The space itself is intimate and elegant, with a focus on the craft unfolding before you.",
            "city": "Bath",
            "address": "6 Chapel Row, Bath BA1 1HN",
            "latitude": 51.3837,
            "longitude": -2.3597,
            "admin_rating": 4.9,
            "images": [],
            "avg_user_rating": 0.0,
            "rating_count": 0,
            "tags": ["award-winning", "specialty", "innovative"],
            "playlist_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX6VdMW310YC7?utm_source=generator&theme=0",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "shop_id": f"shop_{uuid.uuid4().hex[:12]}",
            "name": "Fortitude Coffee",
            "description": "Edinburgh's cozy hideaway with expertly crafted espresso drinks and a warm, welcoming atmosphere in the heart of the Old Town.",
            "detailed_description": "Tucked away on a quiet street in Edinburgh's Old Town, Fortitude Coffee is a haven of warmth and exceptional coffee. This compact cafe punches well above its weight, consistently ranking among Scotland's best specialty coffee destinations.\n\nThe name says it all - there's a quiet strength and determination in everything they do. From the carefully selected rotating guest roasters to the precise preparation of each drink, quality is never compromised. Their signature espresso blend delivers a bold, chocolatey foundation that stands up beautifully in milk-based drinks.\n\nThe interior is snug and inviting, with exposed stone walls that whisper of Edinburgh's rich history. It's the kind of place where strangers become friends over a shared table, and where the bitter Edinburgh wind outside makes the warmth within feel all the more precious.",
            "city": "Edinburgh",
            "address": "3C York Pl, Edinburgh EH1 3EB",
            "latitude": 55.9553,
            "longitude": -3.1883,
            "admin_rating": 4.5,
            "images": [],
            "avg_user_rating": 0.0,
            "rating_count": 0,
            "tags": ["cozy", "old-town", "specialty"],
            "playlist_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX4E3UdUs7fUx?utm_source=generator&theme=0",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "shop_id": f"shop_{uuid.uuid4().hex[:12]}",
            "name": "Quarter Horse Coffee",
            "description": "Birmingham's roastery-cafe hybrid serving freshly roasted beans in a light-filled industrial space. A Midlands coffee revolution.",
            "detailed_description": "Quarter Horse Coffee represents the best of Birmingham's thriving specialty coffee scene. Part roastery, part cafe, this light-filled industrial space in the Jewellery Quarter is where passion for coffee is palpable in every sip.\n\nWhat sets Quarter Horse apart is the immediacy of their coffee journey - beans are roasted on-site, often the same week they're served. This freshness translates into cups bursting with vibrant, complex flavors that evolve as they cool. Their filter coffee bar is a particular highlight, offering three or four different origins brewed through various methods.\n\nThe space itself reflects the area's industrial heritage, with high ceilings, exposed ductwork, and large windows that flood the room with natural light. The roasting equipment sits proudly in view, a constant reminder that great coffee starts with great craft.",
            "city": "Birmingham",
            "address": "88-90 Bristol St, Birmingham B5 7AH",
            "latitude": 52.4739,
            "longitude": -1.8987,
            "admin_rating": 4.4,
            "images": [],
            "avg_user_rating": 0.0,
            "rating_count": 0,
            "tags": ["roastery", "filter-coffee", "jewellery-quarter"],
            "playlist_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZd79rJ6a7lp?utm_source=generator&theme=0",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "shop_id": f"shop_{uuid.uuid4().hex[:12]}",
            "name": "Hard Lines Coffee",
            "description": "Cardiff's cult-favourite roaster blending skate culture with third-wave coffee. Bold flavors, bold vibes, unforgettable brews.",
            "detailed_description": "Hard Lines Coffee is Cardiff's answer to the question: what happens when skate culture collides with third-wave coffee? The result is something utterly unique - a roastery and cafe that's as bold in its personality as it is in its flavor profiles.\n\nFounded with a DIY ethos, Hard Lines has grown from humble beginnings to become one of Wales' most respected specialty coffee roasters. Their approach to sourcing and roasting is meticulous, but their vibe is anything but precious. Expect loud music, stunning artwork on the walls, and baristas who are as passionate about their craft as they are approachable.\n\nThe coffee itself is outstanding - they favor medium to light roasts that let the origin character shine through, with tasting notes that range from juicy tropical fruits to rich dark chocolate. It's coffee that makes you sit up and take notice.",
            "city": "Cardiff",
            "address": "Jacobs Market, West Canal Wharf, Cardiff CF10 5DB",
            "latitude": 51.4756,
            "longitude": -3.1791,
            "admin_rating": 4.3,
            "images": [],
            "avg_user_rating": 0.0,
            "rating_count": 0,
            "tags": ["roastery", "culture", "bold"],
            "playlist_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT?utm_source=generator&theme=0",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.shops.insert_many(sample_shops)
    logger.info(f"Seeded {len(sample_shops)} sample coffee shops")

# ---- STARTUP ----

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.shops.create_index("shop_id", unique=True)
    await db.ratings.create_index([("shop_id", 1), ("user_id", 1)])
    await db.user_sessions.create_index("session_token")
    
    await seed_admin()
    await seed_sample_shops()
    
    # Init storage
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write(f"## Admin\n- Login Name: {os.environ.get('ADMIN_EMAIL', 'test123')}\n")
        f.write(f"- Password: {os.environ.get('ADMIN_PASSWORD', '12345')}\n")
        f.write(f"- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/admin/login (body: {email, password} - email field is used for login name)\n")
        f.write("- POST /api/auth/session (Google Auth)\n")
        f.write("- GET /api/auth/me\n")
        f.write("- POST /api/auth/logout\n\n")
        f.write("## User Auth\n")
        f.write("- Users login via Emergent Google Auth\n")
        f.write("- No test user credentials (Google OAuth)\n")

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
