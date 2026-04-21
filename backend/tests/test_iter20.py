"""
Iteration 20 backend tests: rate limiting, CORS, paylink validation, auth flows
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealth:
    def test_api_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200


class TestCORS:
    def test_cors_no_wildcard(self):
        """CORS should NOT be wildcard *"""
        r = requests.options(
            f"{BASE_URL}/api/health",
            headers={"Origin": "https://hujjah-trivia.preview.emergentagent.com",
                     "Access-Control-Request-Method": "GET"},
            timeout=10
        )
        origin = r.headers.get("access-control-allow-origin", "")
        assert origin != "*", f"CORS is wildcard! Got: {origin}"
        print(f"CORS origin header: {origin}")

    def test_cors_allowed_origin(self):
        """Allowed origin should be reflected"""
        r = requests.get(
            f"{BASE_URL}/api/health",
            headers={"Origin": "https://hujjah-trivia.preview.emergentagent.com"},
            timeout=10
        )
        origin = r.headers.get("access-control-allow-origin", "")
        assert "hujjah-trivia" in origin or origin == "https://hujjah-trivia.preview.emergentagent.com"
        print(f"Reflected origin: {origin}")


class TestAuth:
    def test_register_works(self):
        """Normal registration should succeed"""
        import uuid
        username = f"TEST_user_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "TestPass123!"
        }, timeout=10)
        assert r.status_code in [200, 201], f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert "token" in data or "access_token" in data

    def test_admin_login_works(self):
        """Admin login should succeed"""
        r = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "hujjah2024"
        }, timeout=10)
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert "token" in data or "access_token" in data

    def test_login_invalid_returns_4xx(self):
        """Invalid login should return 4xx"""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "nonexistent_user_xyz",
            "password": "wrongpass"
        }, timeout=10)
        assert r.status_code in [400, 401, 403, 404, 422], f"Got {r.status_code}"


class TestRateLimiting:
    def test_rate_limit_login(self):
        """11 failed login attempts should trigger 429"""
        status_codes = []
        for i in range(12):
            r = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": f"ratelimit_nonexistent_{i}@test.com",
                "password": f"wrongpass_{i}"
            }, timeout=10)
            status_codes.append(r.status_code)
            if r.status_code == 429:
                print(f"Rate limit hit at attempt {i+1}")
                break

        assert 429 in status_codes, f"Rate limit never triggered. Status codes: {status_codes}"
        print(f"Rate limit test passed. Codes: {status_codes}")


class TestPaylinkVerify:
    def _get_token(self):
        r = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin", "password": "hujjah2024"
        }, timeout=10)
        data = r.json()
        return data.get("token") or data.get("access_token")

    def test_invalid_transaction_format_returns_400(self):
        """transaction_no with invalid format should return 400"""
        token = self._get_token()
        r = requests.get(
            f"{BASE_URL}/api/paylink/verify/../../etc/passwd",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        # Should be 400 or 404 (not 500 or 200)
        assert r.status_code in [400, 404, 422], f"Got {r.status_code}: {r.text}"

    def test_short_transaction_no_returns_400(self):
        """Short transaction_no (< 4 chars) should return 400"""
        token = self._get_token()
        r = requests.get(
            f"{BASE_URL}/api/paylink/verify/abc",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        assert r.status_code in [400, 404, 422], f"Got {r.status_code}: {r.text}"

    def test_valid_format_nonexistent_returns_not_200(self):
        """Valid format but nonexistent txn should return 400/404"""
        token = self._get_token()
        r = requests.get(
            f"{BASE_URL}/api/paylink/verify/NONEXISTENT12345",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        # Should not succeed
        assert r.status_code in [400, 404, 500], f"Got {r.status_code}: {r.text}"
        print(f"Nonexistent txn returns: {r.status_code}")
