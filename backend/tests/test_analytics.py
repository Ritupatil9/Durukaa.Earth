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


def _create_site(client, auth_headers):
    project_id = client.post("/api/projects", json={"name": "P"}, headers=auth_headers).json()["id"]
    site = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "S", "geometry": SAMPLE_POLYGON},
        headers=auth_headers,
    ).json()
    return site["id"]


def test_create_and_list_analytics(client, auth_headers):
    site_id = _create_site(client, auth_headers)

    resp = client.post(
        f"/api/sites/{site_id}/analytics",
        json={
            "recorded_date": "2024-06-30",
            "carbon_stock": 1000.0,
            "carbon_sequestration": 40.0,
            "biodiversity_index": 0.5,
            "tree_cover_percentage": 55.0,
            "species_count": 60,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201

    list_resp = client.get(f"/api/sites/{site_id}/analytics", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


def test_summary_computes_change_between_first_and_latest(client, auth_headers):
    site_id = _create_site(client, auth_headers)

    for year, carbon, bio in [(2023, 1000.0, 0.5), (2024, 1100.0, 0.55)]:
        client.post(
            f"/api/sites/{site_id}/analytics",
            json={
                "recorded_date": f"{year}-06-30",
                "carbon_stock": carbon,
                "carbon_sequestration": 40.0,
                "biodiversity_index": bio,
                "tree_cover_percentage": 55.0,
                "species_count": 60,
            },
            headers=auth_headers,
        )

    summary = client.get(f"/api/sites/{site_id}/summary", headers=auth_headers).json()
    assert summary["latest_carbon_stock"] == 1100.0
    assert summary["carbon_change"] == 100.0
