SAMPLE_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [73.4820, 18.5220],
            [73.4990, 18.5220],
            [73.4990, 18.5360],
            [73.4820, 18.5360],
            [73.4820, 18.5220],
        ]
    ],
}


def _create_project(client, auth_headers):
    resp = client.post("/api/projects", json={"name": "Test Project"}, headers=auth_headers)
    return resp.json()["id"]


def test_create_site_converts_geojson_and_computes_area(client, auth_headers):
    project_id = _create_project(client, auth_headers)

    response = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Site A", "description": "Forest site", "geometry": SAMPLE_POLYGON},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Site A"
    assert body["geometry"]["type"] == "Polygon"
    # Area must be computed server-side, and must be > 0 for a real polygon.
    assert body["area_hectares"] > 0


def test_sites_map_returns_valid_feature_collection(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Site B", "geometry": SAMPLE_POLYGON},
        headers=auth_headers,
    )

    response = client.get("/api/sites/map", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "FeatureCollection"
    assert len(body["features"]) >= 1
    feature = body["features"][0]
    assert feature["type"] == "Feature"
    assert "area_hectares" in feature["properties"]


def test_open_polygon_ring_is_rejected(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    bad_polygon = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1]]],  # not closed
    }
    response = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Bad Site", "geometry": bad_polygon},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_site_not_found_returns_404(client, auth_headers):
    response = client.get("/api/sites/999999", headers=auth_headers)
    assert response.status_code == 404
