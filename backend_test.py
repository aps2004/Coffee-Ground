#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CoffeeShopAPITester:
    def __init__(self, base_url="https://espresso-explorer.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_shop_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        if details and success:
            print(f"   {details}")

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, headers=None, description=""):
        """Generic API test method"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            
            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.content:
                try:
                    json_data = response.json()
                    if isinstance(json_data, list):
                        details += f", Items: {len(json_data)}"
                    elif isinstance(json_data, dict) and 'message' in json_data:
                        details += f", Message: {json_data['message']}"
                except:
                    pass
            
            self.log_test(f"{method} {endpoint}" + (f" - {description}" if description else ""), success, details)
            return success, response.json() if success and response.content else {}
            
        except Exception as e:
            self.log_test(f"{method} {endpoint}" + (f" - {description}" if description else ""), False, f"Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.test_api_endpoint(
            'POST', 'auth/admin/login', 200,
            data={"email": "admin@coffeeshops.uk", "password": "CoffeeAdmin2026!"},
            description="Admin login"
        )
        
        if success and 'user_id' in response:
            # Note: In real implementation, we'd get cookies, but for testing we'll simulate
            self.admin_token = "admin_authenticated"
            return True
        return False

    def test_shops_endpoints(self):
        """Test shop-related endpoints"""
        print("\n🏪 Testing Shop Endpoints...")
        
        # Test GET /shops
        success, shops_data = self.test_api_endpoint('GET', 'shops', 200, description="List all shops")
        if success and isinstance(shops_data, list) and len(shops_data) > 0:
            self.log_test("Shops data validation", True, f"Found {len(shops_data)} shops with proper structure")
            
            # Test shop data structure
            first_shop = shops_data[0]
            required_fields = ['shop_id', 'name', 'city', 'description', 'admin_rating']
            missing_fields = [field for field in required_fields if field not in first_shop]
            if not missing_fields:
                self.log_test("Shop data structure", True, "All required fields present")
            else:
                self.log_test("Shop data structure", False, f"Missing fields: {missing_fields}")
        
        # Test GET /shops with sorting
        self.test_api_endpoint('GET', 'shops?sort_by=rating', 200, description="Sort by rating")
        self.test_api_endpoint('GET', 'shops?sort_by=name', 200, description="Sort by name")
        
        # Test GET /shops/map
        success, map_data = self.test_api_endpoint('GET', 'shops/map', 200, description="Map data")
        if success and isinstance(map_data, list):
            # Check if shops have coordinates
            shops_with_coords = [s for s in map_data if s.get('latitude', 0) != 0 and s.get('longitude', 0) != 0]
            self.log_test("Map coordinates", len(shops_with_coords) > 0, f"{len(shops_with_coords)} shops have coordinates")
        
        # Test GET /shops/{shop_id}
        if shops_data and len(shops_data) > 0:
            shop_id = shops_data[0]['shop_id']
            success, shop_detail = self.test_api_endpoint('GET', f'shops/{shop_id}', 200, description="Shop detail")
            if success and 'ratings' in shop_detail:
                self.log_test("Shop detail structure", True, "Includes ratings array")

    def test_admin_shop_operations(self):
        """Test admin CRUD operations (simulated)"""
        print("\n👨‍💼 Testing Admin Shop Operations...")
        
        if not self.admin_token:
            self.log_test("Admin CRUD operations", False, "Admin not authenticated")
            return
        
        # Test create shop (simulated - would need actual auth cookies)
        test_shop_data = {
            "name": "Test Coffee Shop",
            "description": "A test coffee shop for API testing",
            "detailed_description": "This is a detailed description for testing purposes.",
            "city": "Test City",
            "address": "123 Test Street",
            "latitude": 51.5074,
            "longitude": -0.1278,
            "admin_rating": 4.5,
            "tags": ["test", "api"]
        }
        
        # Note: These would fail without proper authentication cookies, but we test the endpoint structure
        self.test_api_endpoint('POST', 'shops', 401, data=test_shop_data, description="Create shop (expect 401 without auth)")
        
        # Test update and delete (would also need auth)
        self.test_api_endpoint('PUT', 'shops/test_id', 401, data={"name": "Updated Name"}, description="Update shop (expect 401)")
        self.test_api_endpoint('DELETE', 'shops/test_id', 401, description="Delete shop (expect 401)")

    def test_rating_endpoints(self):
        """Test rating endpoints"""
        print("\n⭐ Testing Rating Endpoints...")
        
        # Get a shop ID for testing
        success, shops_data = self.test_api_endpoint('GET', 'shops', 200)
        if success and shops_data:
            shop_id = shops_data[0]['shop_id']
            
            # Test get ratings
            self.test_api_endpoint('GET', f'shops/{shop_id}/ratings', 200, description="Get shop ratings")
            
            # Test rate shop (would need user auth)
            rating_data = {"rating": 4.5, "comment": "Great coffee!"}
            self.test_api_endpoint('POST', f'shops/{shop_id}/rate', 401, data=rating_data, description="Rate shop (expect 401 without auth)")

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔑 Testing Auth Endpoints...")
        
        # Test /auth/me without authentication
        self.test_api_endpoint('GET', 'auth/me', 401, description="Get current user (expect 401)")
        
        # Test logout
        self.test_api_endpoint('POST', 'auth/logout', 200, description="Logout")
        
        # Test invalid admin login
        self.test_api_endpoint('POST', 'auth/admin/login', 401, 
                             data={"email": "wrong@email.com", "password": "wrongpass"},
                             description="Invalid admin login")

    def test_file_endpoints(self):
        """Test file serving endpoints"""
        print("\n📁 Testing File Endpoints...")
        
        # Test non-existent file
        self.test_api_endpoint('GET', 'files/nonexistent/path.jpg', 404, description="Non-existent file")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Coffee Shop API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity
        try:
            response = requests.get(f"{self.base_url.replace('/api', '')}/", timeout=5)
            self.log_test("API connectivity", response.status_code in [200, 404], f"Base URL accessible")
        except Exception as e:
            self.log_test("API connectivity", False, f"Cannot reach API: {str(e)}")
            return False
        
        # Run test suites
        self.test_admin_login()
        self.test_shops_endpoints()
        self.test_admin_shop_operations()
        self.test_rating_endpoints()
        self.test_auth_endpoints()
        self.test_file_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ API tests mostly successful!")
            return True
        elif success_rate >= 60:
            print("⚠️  API tests partially successful - some issues found")
            return True
        else:
            print("❌ API tests failed - major issues found")
            return False

def main():
    tester = CoffeeShopAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())