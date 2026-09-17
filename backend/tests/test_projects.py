def test_create_and_retrieve_project(client, auth_headers):
    create_resp = client.post(
        "/api/projects",
        json={"name": "Western Ghats Restoration", "description": "Demo project"},
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    project_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Western Ghats Restoration"


def test_list_projects_includes_site_stats(client, auth_headers):
    client.post("/api/projects", json={"name": "Project A"}, headers=auth_headers)
    response = client.get("/api/projects", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert "site_count" in body[0]
    assert "total_area_hectares" in body[0]


def test_project_not_found_returns_404(client, auth_headers):
    response = client.get("/api/projects/999999", headers=auth_headers)
    assert response.status_code == 404


def test_project_requires_authentication(client):
    response = client.get("/api/projects")
    assert response.status_code == 401


def test_invalid_project_payload_rejected(client, auth_headers):
    response = client.post("/api/projects", json={"description": "no name"}, headers=auth_headers)
    assert response.status_code == 422
