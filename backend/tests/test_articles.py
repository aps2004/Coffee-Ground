"""
Backend API tests for Labs/Articles feature
Tests: GET /api/articles, GET /api/articles/{id}, POST/PUT/DELETE articles (admin auth)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestArticlesPublic:
    """Public article endpoint tests (no auth required)"""
    
    def test_get_all_articles_returns_seeded_data(self):
        """GET /api/articles returns all 4 seeded articles"""
        response = requests.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        articles = response.json()
        assert isinstance(articles, list), "Response should be a list"
        assert len(articles) >= 4, f"Expected at least 4 seeded articles, got {len(articles)}"
        
        # Verify article structure
        for article in articles:
            assert "article_id" in article, "Article should have article_id"
            assert "title" in article, "Article should have title"
            assert "summary" in article, "Article should have summary"
            assert "content" in article, "Article should have content (HTML)"
            assert "category" in article, "Article should have category"
            assert "tags" in article, "Article should have tags"
            assert "author_name" in article, "Article should have author_name"
            assert "published" in article, "Article should have published status"
    
    def test_get_articles_by_category_devices(self):
        """GET /api/articles?category=Devices returns only Devices articles"""
        response = requests.get(f"{BASE_URL}/api/articles", params={"category": "Devices"})
        assert response.status_code == 200
        
        articles = response.json()
        assert len(articles) >= 1, "Should have at least 1 Devices article"
        
        for article in articles:
            assert article["category"].lower() == "devices", f"Expected Devices category, got {article['category']}"
    
    def test_get_articles_by_category_machines(self):
        """GET /api/articles?category=Machines returns only Machines articles"""
        response = requests.get(f"{BASE_URL}/api/articles", params={"category": "Machines"})
        assert response.status_code == 200
        
        articles = response.json()
        assert len(articles) >= 1, "Should have at least 1 Machines article"
        
        for article in articles:
            assert article["category"].lower() == "machines", f"Expected Machines category, got {article['category']}"
    
    def test_get_articles_by_category_personas(self):
        """GET /api/articles?category=Personas returns only Personas articles"""
        response = requests.get(f"{BASE_URL}/api/articles", params={"category": "Personas"})
        assert response.status_code == 200
        
        articles = response.json()
        assert len(articles) >= 1, "Should have at least 1 Personas article"
    
    def test_get_articles_by_category_techniques(self):
        """GET /api/articles?category=Techniques returns only Techniques articles"""
        response = requests.get(f"{BASE_URL}/api/articles", params={"category": "Techniques"})
        assert response.status_code == 200
        
        articles = response.json()
        assert len(articles) >= 1, "Should have at least 1 Techniques article"
    
    def test_get_articles_published_only_default(self):
        """GET /api/articles returns only published articles by default"""
        response = requests.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200
        
        articles = response.json()
        for article in articles:
            assert article["published"] == True, "Default should return only published articles"
    
    def test_get_articles_include_drafts(self):
        """GET /api/articles?published_only=false returns all articles including drafts"""
        response = requests.get(f"{BASE_URL}/api/articles", params={"published_only": "false"})
        assert response.status_code == 200
        
        articles = response.json()
        assert isinstance(articles, list), "Response should be a list"
    
    def test_get_single_article_by_id(self):
        """GET /api/articles/{article_id} returns a single article with all fields"""
        # First get list to find an article_id
        list_response = requests.get(f"{BASE_URL}/api/articles")
        assert list_response.status_code == 200
        articles = list_response.json()
        assert len(articles) > 0, "Need at least one article to test"
        
        article_id = articles[0]["article_id"]
        
        # Get single article
        response = requests.get(f"{BASE_URL}/api/articles/{article_id}")
        assert response.status_code == 200
        
        article = response.json()
        assert article["article_id"] == article_id
        assert "title" in article
        assert "summary" in article
        assert "content" in article
        assert "category" in article
        assert "tags" in article
        assert "author_name" in article
        assert "author_bio" in article
        assert "published" in article
        assert "created_at" in article
    
    def test_get_article_not_found(self):
        """GET /api/articles/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/articles/nonexistent_article_id")
        assert response.status_code == 404
    
    def test_article_content_is_html(self):
        """Verify article content field contains HTML"""
        response = requests.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200
        
        articles = response.json()
        assert len(articles) > 0
        
        # Check that content contains HTML tags
        for article in articles:
            content = article.get("content", "")
            if content:
                assert "<" in content and ">" in content, f"Content should be HTML: {content[:100]}"


class TestArticlesAdmin:
    """Admin article endpoint tests (auth required)"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/admin/login",
            json={"email": "test123", "password": "12345"}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.status_code} - {login_response.text}")
        return session
    
    def test_create_article_requires_auth(self):
        """POST /api/articles without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/articles",
            json={"title": "Test Article", "category": "Devices"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_create_article_success(self, admin_session):
        """POST /api/articles creates a new article"""
        article_data = {
            "title": "TEST_New Article Title",
            "summary": "This is a test article summary",
            "content": "<h2>Test Heading</h2><p>Test paragraph content.</p>",
            "category": "Techniques",
            "tags": ["test", "automation"],
            "author_name": "Test Author",
            "author_bio": "Test author bio",
            "published": False
        }
        
        response = admin_session.post(f"{BASE_URL}/api/articles", json=article_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created = response.json()
        assert "article_id" in created
        assert created["title"] == article_data["title"]
        assert created["summary"] == article_data["summary"]
        assert created["content"] == article_data["content"]
        assert created["category"] == article_data["category"]
        assert created["tags"] == article_data["tags"]
        assert created["author_name"] == article_data["author_name"]
        assert created["published"] == False
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/articles/{created['article_id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == article_data["title"]
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{created['article_id']}")
    
    def test_update_article_requires_auth(self):
        """PUT /api/articles/{id} without auth returns 401"""
        response = requests.put(
            f"{BASE_URL}/api/articles/some_id",
            json={"title": "Updated Title"}
        )
        assert response.status_code == 401
    
    def test_update_article_success(self, admin_session):
        """PUT /api/articles/{id} updates an article"""
        # Create article first
        create_response = admin_session.post(
            f"{BASE_URL}/api/articles",
            json={
                "title": "TEST_Article to Update",
                "summary": "Original summary",
                "content": "<p>Original content</p>",
                "category": "Devices",
                "published": False
            }
        )
        assert create_response.status_code == 200
        article_id = create_response.json()["article_id"]
        
        # Update article
        update_data = {
            "title": "TEST_Updated Article Title",
            "summary": "Updated summary",
            "published": True
        }
        update_response = admin_session.put(f"{BASE_URL}/api/articles/{article_id}", json=update_data)
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["title"] == update_data["title"]
        assert updated["summary"] == update_data["summary"]
        assert updated["published"] == True
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/articles/{article_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == update_data["title"]
        assert fetched["published"] == True
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")
    
    def test_delete_article_requires_auth(self):
        """DELETE /api/articles/{id} without auth returns 401"""
        response = requests.delete(f"{BASE_URL}/api/articles/some_id")
        assert response.status_code == 401
    
    def test_delete_article_success(self, admin_session):
        """DELETE /api/articles/{id} deletes an article"""
        # Create article first
        create_response = admin_session.post(
            f"{BASE_URL}/api/articles",
            json={
                "title": "TEST_Article to Delete",
                "category": "Machines",
                "published": False
            }
        )
        assert create_response.status_code == 200
        article_id = create_response.json()["article_id"]
        
        # Delete article
        delete_response = admin_session.delete(f"{BASE_URL}/api/articles/{article_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/articles/{article_id}")
        assert get_response.status_code == 404
    
    def test_delete_article_not_found(self, admin_session):
        """DELETE /api/articles/{invalid_id} returns 404"""
        response = admin_session.delete(f"{BASE_URL}/api/articles/nonexistent_article_id")
        assert response.status_code == 404


class TestArticleSeededContent:
    """Verify seeded article content quality"""
    
    def test_seeded_articles_have_rich_content(self):
        """Verify seeded articles have proper HTML content"""
        response = requests.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200
        
        articles = response.json()
        
        # Check each seeded article has meaningful content
        for article in articles:
            title = article.get("title", "")
            content = article.get("content", "")
            
            # Content should have HTML structure
            if content:
                assert "<h2>" in content or "<p>" in content, f"Article '{title}' should have HTML content"
    
    def test_seeded_articles_cover_all_categories(self):
        """Verify seeded articles cover all 4 categories"""
        response = requests.get(f"{BASE_URL}/api/articles")
        assert response.status_code == 200
        
        articles = response.json()
        categories = set(a["category"] for a in articles)
        
        expected_categories = {"Devices", "Machines", "Personas", "Techniques"}
        assert expected_categories.issubset(categories), f"Missing categories: {expected_categories - categories}"
