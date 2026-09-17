def test_register_creates_user_and_returns_token(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "SecurePass1"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "alice@example.com"
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]
    assert body["access_token"]


def test_register_duplicate_email_rejected(client):
    payload = {"name": "Bob", "email": "bob@example.com", "password": "SecurePass1"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 400


def test_login_with_correct_credentials(client):
    client.post(
        "/api/auth/register",
        json={"name": "Carol", "email": "carol@example.com", "password": "SecurePass1"},
    )
    response = client.post("/api/auth/login", json={"email": "carol@example.com", "password": "SecurePass1"})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_with_invalid_password_rejected(client):
    client.post(
        "/api/auth/register",
        json={"name": "Dave", "email": "dave@example.com", "password": "SecurePass1"},
    )
    response = client.post("/api/auth/login", json={"email": "dave@example.com", "password": "WrongPassword"})
    assert response.status_code == 401


def test_protected_endpoint_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_protected_endpoint_with_valid_token(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "tester@example.com"
