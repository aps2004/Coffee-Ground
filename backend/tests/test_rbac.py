"""
Backend API tests for Role-Based Access Control (RBAC) feature
Tests: User registration, login, role management, permission enforcement
Roles: guest (no login), user, contributor, admin
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user data with unique identifiers
TEST_USER_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"


class TestUserRegistration:
    """User registration endpoint tests"""
    
    def test_register_creates_user_with_role_user(self):
        """POST /api/auth/register creates a new user with role 'user'"""
        email = f"{TEST_USER_PREFIX}_reg1@example.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Test User", "email": email, "password": "testpass123"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        user = response.json()
        assert "user_id" in user, "Response should have user_id"
        assert user["email"] == email.lower(), f"Email should be {email.lower()}"
        assert user["name"] == "Test User", "Name should match"
        assert user["role"] == "user", f"Role should be 'user', got {user.get('role')}"
        assert "password_hash" not in user, "Password hash should not be returned"
    
    def test_register_rejects_duplicate_email(self):
        """POST /api/auth/register rejects duplicate email with 409"""
        email = f"{TEST_USER_PREFIX}_dup@example.com"
        
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "First User", "email": email, "password": "testpass123"}
        )
        assert response1.status_code == 200, f"First registration failed: {response1.text}"
        
        # Duplicate registration
        response2 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Second User", "email": email, "password": "differentpass"}
        )
        assert response2.status_code == 409, f"Expected 409 for duplicate, got {response2.status_code}"
        assert "already exists" in response2.json().get("detail", "").lower()
    
    def test_register_rejects_short_password(self):
        """POST /api/auth/register rejects password < 6 chars"""
        email = f"{TEST_USER_PREFIX}_short@example.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Test User", "email": email, "password": "12345"}  # 5 chars
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "6 characters" in response.json().get("detail", "").lower()
    
    def test_register_rejects_missing_name(self):
        """POST /api/auth/register rejects missing name"""
        email = f"{TEST_USER_PREFIX}_noname@example.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "testpass123"}
        )
        # Should fail validation
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"


class TestUserLogin:
    """User login endpoint tests"""
    
    @pytest.fixture
    def registered_user(self):
        """Create a registered user for login tests"""
        email = f"{TEST_USER_PREFIX}_login@example.com"
        password = "testpass123"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Login Test User", "email": email, "password": password}
        )
        if response.status_code == 409:
            # User already exists, that's fine
            pass
        elif response.status_code != 200:
            pytest.skip(f"Could not create test user: {response.text}")
        
        return {"email": email, "password": password}
    
    def test_login_works_for_registered_user(self, registered_user):
        """POST /api/auth/login works for registered users"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": registered_user["email"], "password": registered_user["password"]}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        user = response.json()
        assert "user_id" in user
        assert user["email"] == registered_user["email"].lower()
        assert "role" in user
        assert "password_hash" not in user
    
    def test_login_rejects_wrong_password(self, registered_user):
        """POST /api/auth/login rejects wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": registered_user["email"], "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_login_rejects_nonexistent_user(self):
        """POST /api/auth/login rejects nonexistent user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "anypassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminLogin:
    """Admin login endpoint tests"""
    
    def test_admin_login_works(self):
        """POST /api/auth/admin/login works for admin (test123/12345)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": "test123", "password": "12345"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        user = response.json()
        assert user["role"] == "admin", f"Expected admin role, got {user.get('role')}"
        assert "password_hash" not in user
    
    def test_admin_login_rejects_wrong_password(self):
        """POST /api/auth/admin/login rejects wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": "test123", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_login_rejects_non_admin(self):
        """POST /api/auth/admin/login rejects non-admin users"""
        # First register a regular user
        email = f"{TEST_USER_PREFIX}_nonadmin@example.com"
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Regular User", "email": email, "password": "testpass123"}
        )
        
        # Try admin login with regular user
        response = requests.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": email, "password": "testpass123"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAuthMe:
    """GET /api/auth/me endpoint tests"""
    
    def test_auth_me_returns_user_info_with_role(self):
        """GET /api/auth/me returns user info with role"""
        session = requests.Session()
        
        # Login as admin
        login_response = session.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": "test123", "password": "12345"}
        )
        assert login_response.status_code == 200
        
        # Get current user
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}"
        
        user = me_response.json()
        assert "user_id" in user
        assert "email" in user
        assert "role" in user
        assert user["role"] == "admin"
    
    def test_auth_me_requires_auth(self):
        """GET /api/auth/me returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestUserManagement:
    """User management endpoint tests (admin only)"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": "test123", "password": "12345"}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        return session
    
    @pytest.fixture
    def user_session(self):
        """Get authenticated regular user session"""
        session = requests.Session()
        email = f"{TEST_USER_PREFIX}_usersess@example.com"
        
        # Register user
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Regular User", "email": email, "password": "testpass123"}
        )
        if reg_response.status_code == 409:
            # Already exists, login instead
            login_response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "testpass123"}
            )
            if login_response.status_code != 200:
                pytest.skip(f"User login failed: {login_response.text}")
        elif reg_response.status_code != 200:
            pytest.skip(f"User registration failed: {reg_response.text}")
        
        return session
    
    def test_list_users_admin_only(self, admin_session):
        """GET /api/auth/users (admin only) returns all users"""
        response = admin_session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        assert len(users) >= 1, "Should have at least 1 user (admin)"
        
        # Verify user structure
        for user in users:
            assert "user_id" in user
            assert "email" in user
            assert "role" in user
            assert "password_hash" not in user, "Password hash should not be returned"
    
    def test_list_users_returns_403_for_non_admin(self, user_session):
        """GET /api/auth/users returns 403 for non-admin"""
        response = user_session.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_list_users_returns_401_without_auth(self):
        """GET /api/auth/users returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 401
    
    def test_change_role_admin_only(self, admin_session):
        """PUT /api/auth/users/{user_id}/role changes role (admin only)"""
        # Create a test user
        email = f"{TEST_USER_PREFIX}_rolechange@example.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Role Change User", "email": email, "password": "testpass123"}
        )
        
        if reg_response.status_code == 409:
            # User exists, get their ID from users list
            users_response = admin_session.get(f"{BASE_URL}/api/auth/users")
            users = users_response.json()
            user = next((u for u in users if u["email"] == email.lower()), None)
            if not user:
                pytest.skip("Could not find test user")
            user_id = user["user_id"]
        else:
            assert reg_response.status_code == 200
            user_id = reg_response.json()["user_id"]
        
        # Change role to contributor
        response = admin_session.put(
            f"{BASE_URL}/api/auth/users/{user_id}/role",
            json={"role": "contributor"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated = response.json()
        assert updated["role"] == "contributor", f"Expected contributor role, got {updated.get('role')}"
        
        # Verify persistence
        users_response = admin_session.get(f"{BASE_URL}/api/auth/users")
        users = users_response.json()
        user = next((u for u in users if u["user_id"] == user_id), None)
        assert user is not None
        assert user["role"] == "contributor"
        
        # Change back to user
        admin_session.put(f"{BASE_URL}/api/auth/users/{user_id}/role", json={"role": "user"})
    
    def test_change_role_returns_403_for_non_admin(self, user_session, admin_session):
        """PUT /api/auth/users/{user_id}/role returns 403 for non-admin"""
        # Get any user ID
        users_response = admin_session.get(f"{BASE_URL}/api/auth/users")
        users = users_response.json()
        if not users:
            pytest.skip("No users to test with")
        
        user_id = users[0]["user_id"]
        
        response = user_session.put(
            f"{BASE_URL}/api/auth/users/{user_id}/role",
            json={"role": "contributor"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_change_role_invalid_role(self, admin_session):
        """PUT /api/auth/users/{user_id}/role rejects invalid role"""
        # Get any user ID
        users_response = admin_session.get(f"{BASE_URL}/api/auth/users")
        users = users_response.json()
        non_admin_user = next((u for u in users if u["role"] != "admin"), None)
        if not non_admin_user:
            pytest.skip("No non-admin user to test with")
        
        response = admin_session.put(
            f"{BASE_URL}/api/auth/users/{non_admin_user['user_id']}/role",
            json={"role": "superadmin"}  # Invalid role
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestShopPermissions:
    """Shop CRUD permission tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": "test123", "password": "12345"}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        return session
    
    @pytest.fixture
    def contributor_session(self, admin_session):
        """Get authenticated contributor session"""
        session = requests.Session()
        email = f"{TEST_USER_PREFIX}_contrib@example.com"
        
        # Register user
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Contributor User", "email": email, "password": "testpass123"}
        )
        
        if reg_response.status_code == 200:
            user_id = reg_response.json()["user_id"]
        elif reg_response.status_code == 409:
            # User exists, login and get ID
            login_response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "testpass123"}
            )
            if login_response.status_code != 200:
                pytest.skip(f"Contributor login failed: {login_response.text}")
            user_id = login_response.json()["user_id"]
        else:
            pytest.skip(f"Contributor registration failed: {reg_response.text}")
        
        # Promote to contributor
        admin_session.put(
            f"{BASE_URL}/api/auth/users/{user_id}/role",
            json={"role": "contributor"}
        )
        
        # Re-login to get updated session
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": "testpass123"}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Contributor re-login failed: {login_response.text}")
        
        return session
    
    @pytest.fixture
    def user_session(self):
        """Get authenticated regular user session"""
        session = requests.Session()
        email = f"{TEST_USER_PREFIX}_reguser@example.com"
        
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Regular User", "email": email, "password": "testpass123"}
        )
        if reg_response.status_code == 409:
            login_response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "testpass123"}
            )
            if login_response.status_code != 200:
                pytest.skip(f"User login failed: {login_response.text}")
        elif reg_response.status_code != 200:
            pytest.skip(f"User registration failed: {reg_response.text}")
        
        return session
    
    def test_create_shop_requires_contributor_or_admin(self, contributor_session):
        """POST /api/shops requires contributor or admin role"""
        shop_data = {
            "name": f"TEST_{TEST_USER_PREFIX}_Shop",
            "description": "Test shop description",
            "city": "London"
        }
        
        response = contributor_session.post(f"{BASE_URL}/api/shops", json=shop_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        shop = response.json()
        assert "shop_id" in shop
        assert shop["name"] == shop_data["name"]
        
        # Cleanup
        contributor_session.delete(f"{BASE_URL}/api/shops/{shop['shop_id']}")
    
    def test_create_shop_returns_403_for_regular_user(self, user_session):
        """POST /api/shops returns 403 for regular users"""
        shop_data = {
            "name": "Test Shop",
            "description": "Test description",
            "city": "London"
        }
        
        response = user_session.post(f"{BASE_URL}/api/shops", json=shop_data)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_contributor_can_only_edit_own_shops(self, contributor_session, admin_session):
        """PUT /api/shops/{id} - contributor can only edit own shops"""
        # Create a shop as contributor
        shop_data = {
            "name": f"TEST_{TEST_USER_PREFIX}_OwnShop",
            "description": "Contributor's shop",
            "city": "Manchester"
        }
        create_response = contributor_session.post(f"{BASE_URL}/api/shops", json=shop_data)
        assert create_response.status_code == 200
        own_shop_id = create_response.json()["shop_id"]
        
        # Contributor can edit own shop
        update_response = contributor_session.put(
            f"{BASE_URL}/api/shops/{own_shop_id}",
            json={"description": "Updated description"}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Get a shop created by someone else (seeded shops)
        shops_response = requests.get(f"{BASE_URL}/api/shops")
        shops = shops_response.json()
        other_shop = next((s for s in shops if s.get("created_by") != contributor_session.cookies.get("user_id") and s["shop_id"] != own_shop_id), None)
        
        if other_shop:
            # Contributor cannot edit other's shop
            other_update_response = contributor_session.put(
                f"{BASE_URL}/api/shops/{other_shop['shop_id']}",
                json={"description": "Trying to edit other's shop"}
            )
            assert other_update_response.status_code == 403, f"Expected 403, got {other_update_response.status_code}"
        
        # Cleanup
        contributor_session.delete(f"{BASE_URL}/api/shops/{own_shop_id}")
    
    def test_contributor_can_only_delete_own_shops(self, contributor_session, admin_session):
        """DELETE /api/shops/{id} - contributor can only delete own shops"""
        # Create a shop as contributor
        shop_data = {
            "name": f"TEST_{TEST_USER_PREFIX}_DeleteShop",
            "description": "Shop to delete",
            "city": "Birmingham"
        }
        create_response = contributor_session.post(f"{BASE_URL}/api/shops", json=shop_data)
        assert create_response.status_code == 200
        own_shop_id = create_response.json()["shop_id"]
        
        # Get a shop created by someone else
        shops_response = requests.get(f"{BASE_URL}/api/shops")
        shops = shops_response.json()
        other_shop = next((s for s in shops if s.get("created_by") == "system"), None)
        
        if other_shop:
            # Contributor cannot delete other's shop
            other_delete_response = contributor_session.delete(f"{BASE_URL}/api/shops/{other_shop['shop_id']}")
            assert other_delete_response.status_code == 403, f"Expected 403, got {other_delete_response.status_code}"
        
        # Contributor can delete own shop
        delete_response = contributor_session.delete(f"{BASE_URL}/api/shops/{own_shop_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
    
    def test_admin_can_edit_any_shop(self, admin_session):
        """Admin can edit any shop"""
        # Get any shop
        shops_response = requests.get(f"{BASE_URL}/api/shops")
        shops = shops_response.json()
        if not shops:
            pytest.skip("No shops to test with")
        
        shop = shops[0]
        original_desc = shop.get("description", "")
        
        # Admin can edit
        update_response = admin_session.put(
            f"{BASE_URL}/api/shops/{shop['shop_id']}",
            json={"description": "Admin updated description"}
        )
        assert update_response.status_code == 200
        
        # Restore original
        admin_session.put(
            f"{BASE_URL}/api/shops/{shop['shop_id']}",
            json={"description": original_desc}
        )


class TestRatingPermissions:
    """Rating permission tests - all authenticated users can rate"""
    
    @pytest.fixture
    def user_session(self):
        """Get authenticated regular user session"""
        session = requests.Session()
        email = f"{TEST_USER_PREFIX}_rater@example.com"
        
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"name": "Rating User", "email": email, "password": "testpass123"}
        )
        if reg_response.status_code == 409:
            login_response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "testpass123"}
            )
            if login_response.status_code != 200:
                pytest.skip(f"User login failed: {login_response.text}")
        elif reg_response.status_code != 200:
            pytest.skip(f"User registration failed: {reg_response.text}")
        
        return session
    
    def test_authenticated_user_can_rate(self, user_session):
        """Authenticated users can rate shops"""
        # Get a shop
        shops_response = requests.get(f"{BASE_URL}/api/shops")
        shops = shops_response.json()
        if not shops:
            pytest.skip("No shops to test with")
        
        shop_id = shops[0]["shop_id"]
        
        # Rate the shop
        response = user_session.post(
            f"{BASE_URL}/api/shops/{shop_id}/rate",
            json={"rating": 4, "comment": "Great coffee!"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_unauthenticated_cannot_rate(self):
        """Unauthenticated users cannot rate shops"""
        shops_response = requests.get(f"{BASE_URL}/api/shops")
        shops = shops_response.json()
        if not shops:
            pytest.skip("No shops to test with")
        
        shop_id = shops[0]["shop_id"]
        
        response = requests.post(
            f"{BASE_URL}/api/shops/{shop_id}/rate",
            json={"rating": 4, "comment": "Test"}
        )
        assert response.status_code == 401


# Cleanup fixture to run after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_users():
    """Cleanup test users after all tests complete"""
    yield
    # Note: In a real scenario, we'd clean up test users here
    # For now, test users with TEST_ prefix can be identified and cleaned manually
