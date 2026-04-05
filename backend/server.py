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

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

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

async def require_contributor_or_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") not in ("admin", "contributor"):
        raise HTTPException(status_code=403, detail="Contributor or admin access required")
    return user

async def require_authenticated(request: Request):
    user = await get_current_user(request)
    if user.get("role") not in ("user", "contributor", "admin"):
        raise HTTPException(status_code=403, detail="Authentication required")
    return user

# Pydantic models
class AdminLoginRequest(BaseModel):
    email: str
    password: str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

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
    highlighted: bool = False

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
    highlighted: Optional[bool] = None

class RatingCreate(BaseModel):
    rating: float
    comment: str = ""

# Create the main app
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Brute-force protection config
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

async def check_brute_force(email: str):
    """Check if account is locked due to too many failed login attempts."""
    record = await db.login_attempts.find_one({"email": email}, {"_id": 0})
    if record and record.get("locked_until"):
        locked_until = datetime.fromisoformat(record["locked_until"])
        if datetime.now(timezone.utc) < locked_until:
            remaining = int((locked_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Account locked due to too many failed attempts. Try again in {remaining} minute(s)."
            )
        else:
            # Lock expired, reset
            await db.login_attempts.delete_one({"email": email})

async def record_failed_login(email: str):
    """Record a failed login attempt and lock if threshold exceeded."""
    record = await db.login_attempts.find_one({"email": email})
    if record:
        attempts = record.get("attempts", 0) + 1
        update = {"$set": {"attempts": attempts, "last_attempt": datetime.now(timezone.utc).isoformat()}}
        if attempts >= MAX_FAILED_ATTEMPTS:
            locked_until = (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
            update["$set"]["locked_until"] = locked_until
            logger.warning(f"Account locked for {email} after {attempts} failed attempts")
        await db.login_attempts.update_one({"email": email}, update)
    else:
        await db.login_attempts.insert_one({
            "email": email,
            "attempts": 1,
            "last_attempt": datetime.now(timezone.utc).isoformat(),
            "locked_until": None
        })

async def clear_failed_logins(email: str):
    """Clear failed login attempts on successful login."""
    await db.login_attempts.delete_one({"email": email})

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ---- AUTH ENDPOINTS ----

@api_router.post("/auth/admin/login")
@limiter.limit("5/minute")
async def admin_login(request: Request, req: AdminLoginRequest, response: Response):
    email = req.email.lower().strip()
    await check_brute_force(email)
    user = await db.users.find_one({"email": email, "role": "admin"}, {"_id": 0})
    if not user:
        await record_failed_login(email)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user["password_hash"]):
        await record_failed_login(email)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await clear_failed_logins(email)
    access_token = create_access_token(user["user_id"], email, "admin")
    refresh_token = create_refresh_token(user["user_id"])
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    user_data = {k: v for k, v in user.items() if k != "password_hash"}
    return user_data

@api_router.post("/auth/register")
@limiter.limit("3/minute")
async def register_user(request: Request, req: UserRegisterRequest, response: Response):
    email = req.email.lower().strip()
    name = req.name.strip()
    if not email or not req.password or not name:
        raise HTTPException(status_code=400, detail="Name, email and password are required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(req.password)
    await db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "password_hash": hashed,
        "name": name,
        "role": "user",
        "picture": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login_user(request: Request, req: UserLoginRequest, response: Response):
    email = req.email.lower().strip()
    await check_brute_force(email)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        await record_failed_login(email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(req.password, user["password_hash"]):
        await record_failed_login(email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await clear_failed_logins(email)
    access_token = create_access_token(user["user_id"], email, user.get("role", "user"))
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

@api_router.post("/auth/change-password")
@limiter.limit("3/minute")
async def change_password(req: PasswordChangeRequest, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Fetch full user record with password hash
    full_user = await db.users.find_one({"user_id": user["user_id"]})
    if not full_user or not full_user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Password change not available for this account")
    
    if not verify_password(req.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    new_hash = hash_password(req.new_password)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"password_hash": new_hash}})
    return {"message": "Password updated successfully"}

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
    user = await require_contributor_or_admin(request)
    body = await request.json()
    shop_data = ShopCreate(**body)
    
    shop_id = f"shop_{uuid.uuid4().hex[:12]}"
    doc = {
        "shop_id": shop_id,
        **shop_data.model_dump(),
        "images": [],
        "avg_user_rating": 0.0,
        "rating_count": 0,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shops.insert_one(doc)
    created = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    return created

@api_router.put("/shops/{shop_id}")
async def update_shop(shop_id: str, request: Request):
    user = await require_contributor_or_admin(request)
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    # Contributors can only edit their own shops
    if user.get("role") == "contributor" and shop.get("created_by") != user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only edit shops you created")
    body = await request.json()
    update_data = ShopUpdate(**body)
    
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    # Only admins can set highlighted
    if user.get("role") != "admin" and "highlighted" in update_fields:
        del update_fields["highlighted"]
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.shops.update_one({"shop_id": shop_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    updated = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    return updated

@api_router.delete("/shops/{shop_id}")
async def delete_shop(shop_id: str, request: Request):
    user = await require_contributor_or_admin(request)
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if user.get("role") == "contributor" and shop.get("created_by") != user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only delete shops you created")
    await db.shops.delete_one({"shop_id": shop_id})
    return {"message": "Shop deleted"}

# ---- IMAGE ENDPOINTS ----

@api_router.post("/shops/{shop_id}/images")
async def upload_shop_image(shop_id: str, request: Request, file: UploadFile = File(...)):
    user = await require_contributor_or_admin(request)
    
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if user.get("role") == "contributor" and shop.get("created_by") != user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only upload images to your own shops")
    
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
    user = await require_contributor_or_admin(request)
    shop = await db.shops.find_one({"shop_id": shop_id}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if user.get("role") == "contributor" and shop.get("created_by") != user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only delete images from your own shops")
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
@limiter.limit("5/minute")
async def submit_contact(request: Request, req: ContactCreate):
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

# ---- USER MANAGEMENT ENDPOINTS (Admin only) ----

@api_router.get("/auth/users")
async def list_users(request: Request, role: str = None):
    await require_admin(request)
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users

@api_router.put("/auth/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    current_admin = await require_admin(request)
    body = await request.json()
    new_role = body.get("role")
    if new_role not in ("user", "contributor", "admin"):
        raise HTTPException(status_code=400, detail="Role must be user, contributor, or admin")
    
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion
    if current_admin["user_id"] == user_id and new_role != "admin":
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    
    # Ensure at least one admin remains
    if target.get("role") == "admin" and new_role != "admin":
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last admin")
    
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": new_role}})
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.get("/auth/contributors")
async def list_contributors(request: Request):
    await require_admin(request)
    contributors = await db.users.find({"role": "contributor"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(200)
    return contributors

# ---- ARTICLE ENDPOINTS ----

ARTICLE_CATEGORIES = ["Devices", "Machines", "Personas", "Techniques"]

class ArticleSectionInput(BaseModel):
    heading: str = ""
    body: str = ""
    image_path: str = ""

class ArticleCreate(BaseModel):
    title: str
    summary: str = ""
    content: str = ""
    category: str = ""
    tags: List[str] = []
    author_name: str = ""
    author_bio: str = ""
    author_image: str = ""
    sections: List[dict] = []
    published: bool = False

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    author_name: Optional[str] = None
    author_bio: Optional[str] = None
    author_image: Optional[str] = None
    sections: Optional[List[dict]] = None
    published: Optional[bool] = None

@api_router.get("/articles")
async def list_articles(category: str = None, published_only: str = "true"):
    query = {}
    if published_only == "true":
        query["published"] = True
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    articles = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return articles

@api_router.get("/articles/{article_id}")
async def get_article(article_id: str):
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@api_router.post("/articles")
async def create_article(request: Request):
    admin = await require_admin(request)
    body = await request.json()
    data = ArticleCreate(**body)
    article_id = f"art_{uuid.uuid4().hex[:12]}"
    doc = {
        "article_id": article_id,
        **data.model_dump(),
        "cover_image": "",
        "created_by": admin["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.articles.insert_one(doc)
    created = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    return created

@api_router.put("/articles/{article_id}")
async def update_article(article_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    data = ArticleUpdate(**body)
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.articles.update_one({"article_id": article_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    updated = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    return updated

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, request: Request):
    await require_admin(request)
    result = await db.articles.delete_one({"article_id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"message": "Article deleted"}

@api_router.post("/articles/{article_id}/cover")
async def upload_article_cover(article_id: str, request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/articles/{article_id}/cover.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    await db.articles.update_one({"article_id": article_id}, {"$set": {"cover_image": result["path"]}})
    return {"cover_image": result["path"]}

@api_router.post("/articles/{article_id}/section-image/{section_index}")
async def upload_section_image(article_id: str, section_index: int, request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/articles/{article_id}/section_{section_index}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    sections = article.get("sections", [])
    if section_index < len(sections):
        sections[section_index]["image_path"] = result["path"]
        await db.articles.update_one({"article_id": article_id}, {"$set": {"sections": sections}})
    return {"image_path": result["path"]}

@api_router.post("/articles/{article_id}/author-image")
async def upload_author_image(article_id: str, request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/articles/{article_id}/author.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    await db.articles.update_one({"article_id": article_id}, {"$set": {"author_image": result["path"]}})
    return {"author_image": result["path"]}

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
    elif existing.get("password_hash") and not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}}
        )
        logger.info("Admin password updated")
    elif not existing.get("password_hash"):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}}
        )
        logger.info("Admin password and role set on existing account")

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

def _sections_to_html(sections):
    """Convert legacy section list to rich HTML content."""
    html = ""
    for s in sections:
        if s.get("heading"):
            html += f"<h2>{s['heading']}</h2>\n"
        if s.get("body"):
            for para in s["body"].split("\n\n"):
                html += f"<p>{para.strip()}</p>\n"
    return html

async def seed_sample_articles():
    count = await db.articles.count_documents({})
    if count > 0:
        return

    raw_articles = [
        {
            "title": "The V60 Pour-Over: A Ritual Worth Mastering",
            "summary": "The Hario V60 has become the gold standard for manual pour-over brewing. We break down the technique, the science, and why this simple cone produces extraordinary coffee.",
            "category": "Devices",
            "tags": ["pour-over", "v60", "brewing", "technique"],
            "author_name": "James Hartley",
            "author_bio": "Co-founder of Coffee Grind and Chief Taster. Third-generation tea merchant turned coffee evangelist.",
            "sections": [
                {"heading": "Why the V60?", "body": "The Hario V60 \u2014 named for its V shape and 60-degree angle \u2014 is deceptively simple. A single cone of ceramic, glass, or plastic with spiral ridges inside. No moving parts, no electronics, no buttons. Yet in the hands of a skilled brewer, it produces coffee of breathtaking clarity and complexity.\n\nWhat makes it special is airflow. Those spiral ridges create channels between the filter paper and the cone walls, allowing air to escape evenly during extraction. This means the water flows through the grounds at a consistent rate, extracting flavour compounds in a balanced, predictable way.", "image_path": ""},
                {"heading": "The Perfect Technique", "body": "Start with 15g of medium-fine coffee and 250ml of water at 93\u00b0C. The grind should resemble coarse sand \u2014 too fine and you'll over-extract, too coarse and the water rushes through.\n\nBegin with a 30-second bloom: pour 30ml of water in a gentle spiral, saturating all the grounds. Watch as the coffee bed rises and bubbles \u2014 that's CO2 escaping, a sign of freshness. After the bloom, pour in slow, concentric circles, keeping the water level consistent. The total brew time should be around 2:30 to 3:00 minutes.", "image_path": ""},
                {"heading": "Common Mistakes", "body": "The biggest error beginners make is pouring too fast. The V60 rewards patience. A steady, controlled pour gives you a clean, nuanced cup. Rushing creates channels in the coffee bed where water takes the path of least resistance, leading to uneven extraction.\n\nAnother common mistake is using water straight off the boil. Let it cool for 30 seconds. Boiling water scorches the grounds and produces bitter, harsh flavours that mask the delicate origin character.", "image_path": ""}
            ],
        },
        {
            "title": "La Marzocco Linea Mini: The Home Espresso Revolution",
            "summary": "Once the preserve of commercial kitchens, the La Marzocco Linea Mini brought professional-grade espresso into the home. We explore what makes this machine a modern icon.",
            "category": "Machines",
            "tags": ["espresso", "la-marzocco", "home-brewing", "machines"],
            "author_name": "Eleanor Whitfield",
            "author_bio": "Co-founder and Editor-in-Chief of Coffee Grind. Former food journalist with a decade covering the UK dining scene.",
            "sections": [
                {"heading": "A Commercial Heart in a Domestic Body", "body": "The Linea Mini takes the dual-boiler system from La Marzocco's legendary Linea Classic \u2014 the machine that built the specialty coffee industry \u2014 and shrinks it to countertop size. The result is a home machine with the thermal stability and extraction quality of a professional setup.\n\nThe saturated group head maintains temperature within 0.5\u00b0C during extraction, meaning every shot pulls with the same consistency. This is the difference between good espresso and exceptional espresso.", "image_path": ""},
                {"heading": "Living With the Linea Mini", "body": "After six months with a Linea Mini in the Coffee Grind test kitchen, we can confirm: it changes your relationship with coffee. The 20-minute warm-up time encourages a morning ritual. The mechanical paddle gives you physical control over extraction.\n\nThe machine is beautiful too \u2014 available in a range of colours, with clean Italian design lines that make it a genuine piece of kitchen furniture. It's an investment at roughly \u00a33,500, but for daily espresso drinkers, the per-cup cost drops below caf\u00e9 prices within two years.", "image_path": ""},
                {"heading": "Who Is It For?", "body": "The Linea Mini is for the serious home barista who has outgrown pod machines and entry-level espresso makers. It demands good beans, a quality grinder (budget at least \u00a3400 for a Niche Zero or Eureka Mignon), and a willingness to learn.\n\nIf you're the type who weighs doses to the tenth of a gram and times shots with a stopwatch, this machine will reward your obsession. If you want convenience above all else, look elsewhere.", "image_path": ""}
            ],
        },
        {
            "title": "Maxwell Colonna-Dashwood: The Scientist Behind the Cup",
            "summary": "Three-time UK Barista Champion and founder of Colonna & Smalls, Maxwell Colonna-Dashwood has spent two decades pushing the boundaries of what coffee can be.",
            "category": "Personas",
            "tags": ["interview", "barista-champion", "colonna", "specialty"],
            "author_name": "Eleanor Whitfield",
            "author_bio": "Co-founder and Editor-in-Chief of Coffee Grind.",
            "sections": [
                {"heading": "The Path to Three Championships", "body": "Maxwell Colonna-Dashwood didn't set out to become a coffee legend. A music graduate from Bath Spa University, he stumbled into specialty coffee while working part-time at a local caf\u00e9. But once he understood the science \u2014 the chemistry of extraction, the physics of water temperature, the biology of fermentation \u2014 he was hooked.\n\n\"Coffee is the most complex beverage we consume,\" he tells me over a precisely brewed filter at Colonna & Smalls in Bath. \"Wine has around 200 flavour compounds. Coffee has over 1,000. We're only beginning to understand what's possible.\"", "image_path": ""},
                {"heading": "Water: The Hidden Variable", "body": "Maxwell's most significant contribution to the industry has been his research on water. His book, 'Water For Coffee,' co-authored with Christopher Hendon, demonstrated that the mineral composition of water fundamentally alters extraction and flavour.\n\n\"The same bean, the same grind, the same temperature \u2014 change the water and you get a completely different cup,\" he explains. \"We found that certain mineral profiles enhance acidity, while others emphasise sweetness. It was a revelation.\"", "image_path": ""},
                {"heading": "The Future of Specialty Coffee", "body": "Looking ahead, Maxwell sees a coffee industry that's more transparent, more scientific, and more accessible. \"The third wave democratised quality. The next wave will democratise knowledge. Imagine scanning a QR code on your bag of beans and seeing every data point from farm to cup \u2014 altitude, processing method, roast profile, even the water recipe for optimal brewing.\"\n\nHis vision is already taking shape at Colonna & Smalls, where the menu is organised by flavour profile rather than drink type, encouraging exploration over habit.", "image_path": ""}
            ],
        },
        {
            "title": "Cold Brew vs Iced Pour-Over: The Summer Showdown",
            "summary": "Two methods, two philosophies, one goal: exceptional cold coffee. We put cold brew and iced pour-over head to head to settle the summer debate once and for all.",
            "category": "Techniques",
            "tags": ["cold-brew", "iced-coffee", "summer", "techniques"],
            "author_name": "James Hartley",
            "author_bio": "Co-founder of Coffee Grind. Manages The Grinder and roaster relationships nationwide.",
            "sections": [
                {"heading": "Cold Brew: The Patient Approach", "body": "Cold brew is the slow play. Coarsely ground coffee steeped in cold water for 12\u201324 hours, then filtered. The long extraction at low temperature produces a concentrate that's smooth, sweet, and low in acidity.\n\nThe science is straightforward: cold water extracts different compounds than hot water. You get fewer of the bright, volatile acids that define a hot pour-over, and more of the sugars and chocolatey compounds that make cold brew feel like liquid velvet. The result is a forgiving, approachable cup that works beautifully with milk or on its own over ice.", "image_path": ""},
                {"heading": "Iced Pour-Over: The Bright Alternative", "body": "The Japanese iced method \u2014 brewing hot coffee directly onto ice \u2014 is cold brew's polar opposite. It's fast (3 minutes vs 12 hours), bright, and preserves the aromatics that cold brew mutes.\n\nThe technique: halve your water volume but keep the same dose of coffee. Brew hot directly onto an equal weight of ice. The ice rapidly chills the coffee, locking in volatile flavour compounds that would otherwise dissipate. The result is a cold cup with the clarity and complexity of a hot pour-over \u2014 fruit-forward, floral, and dynamic.", "image_path": ""},
                {"heading": "The Verdict", "body": "There's no winner \u2014 only context. Cold brew is your companion for long summer afternoons: mellow, forgiving, batch-friendly. Make a litre on Sunday and drink it all week.\n\nIced pour-over is for the moment when you want to taste the difference between a Kenyan and an Ethiopian, cold. It demands more effort but delivers more nuance. In our test kitchen, we keep both on rotation from May to September.\n\nThe real question isn't which is better \u2014 it's which beans to use for each. Our recommendation: medium-dark roasts for cold brew (to enhance that chocolate sweetness) and light, fruity roasts for iced pour-over (to maximise brightness).", "image_path": ""}
            ],
        }
    ]

    articles = []
    cover_images = {
        "The V60 Pour-Over: A Ritual Worth Mastering": "https://images.unsplash.com/photo-1559648617-374af4ae6c2b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwxfHxWNjAlMjBwb3VyJTIwb3ZlciUyMGNvZmZlZSUyMGJyZXdpbmd8ZW58MHx8fHwxNzc1MzA1NTk1fDA&ixlib=rb-4.1.0&q=85",
        "La Marzocco Linea Mini: The Home Espresso Revolution": "https://images.unsplash.com/photo-1582572426223-d152057ba012?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxMYSUyME1hcnpvY2NvJTIwZXNwcmVzc28lMjBtYWNoaW5lfGVufDB8fHx8MTc3NTMwNTU5NXww&ixlib=rb-4.1.0&q=85",
        "Maxwell Colonna-Dashwood: The Scientist Behind the Cup": "https://images.unsplash.com/photo-1551815105-e2fd6848e665?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxiYXJpc3RhJTIwY3VwcGluZyUyMGNvZmZlZSUyMHRhc3RpbmclMjBwcm9mZXNzaW9uYWx8ZW58MHx8fHwxNzc1MzA1NjA2fDA&ixlib=rb-4.1.0&q=85",
        "Cold Brew vs Iced Pour-Over: The Summer Showdown": "https://images.unsplash.com/photo-1770326965745-079ca2abbc06?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxjb2xkJTIwYnJldyUyMGljZWQlMjBjb2ZmZWUlMjBwcmVwYXJhdGlvbnxlbnwwfHx8fDE3NzUzMDU1OTV8MA&ixlib=rb-4.1.0&q=85",
    }
    for raw in raw_articles:
        articles.append({
            "article_id": f"art_{uuid.uuid4().hex[:12]}",
            **raw,
            "content": _sections_to_html(raw["sections"]),
            "cover_image": cover_images.get(raw["title"], ""),
            "author_image": "",
            "published": True,
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

    await db.articles.insert_many(articles)
    logger.info(f"Seeded {len(articles)} sample articles")

# ---- STARTUP ----

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.shops.create_index("shop_id", unique=True)
    await db.ratings.create_index([("shop_id", 1), ("user_id", 1)])
    await db.user_sessions.create_index("session_token")
    await db.articles.create_index("article_id", unique=True)
    await db.articles.create_index("category")
    await db.login_attempts.create_index("email", unique=True)
    await db.login_attempts.create_index("last_attempt", expireAfterSeconds=3600)
    
    await seed_admin()
    await seed_sample_shops()
    await seed_sample_articles()
    
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
        f.write("- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/admin/login (body: {email, password} - email field is used for login name)\n")
        f.write("- POST /api/auth/register (body: {name, email, password} - creates user role)\n")
        f.write("- POST /api/auth/login (body: {email, password} - any role)\n")
        f.write("- POST /api/auth/session (Google Auth)\n")
        f.write("- GET /api/auth/me\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/users (admin only - list all users)\n")
        f.write("- PUT /api/auth/users/{user_id}/role (admin only - change role)\n\n")
        f.write("## Roles\n")
        f.write("- guest: Browse only (no login)\n")
        f.write("- user: Rate & comment on cafes\n")
        f.write("- contributor: Create/edit/delete own shops & images\n")
        f.write("- admin: Full access\n")

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
