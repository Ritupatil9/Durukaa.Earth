"""
Deterministic seed data for local development / demos.

IMPORTANT: All analytics figures generated here are synthetic
DEMONSTRATION DATA meant to exercise the charts and summary endpoints.
They are NOT real environmental measurements of any actual location.

Run with:  python -m app.seed
"""

from datetime import date

from app.database import Base, SessionLocal, engine
from app.models.project import Project
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User
from app.services.geo import calculate_area_hectares, geojson_to_geometry
from app.utils.security import hash_password

ADMIN_EMAIL = "admin@darukaa.earth"
ADMIN_PASSWORD = "Admin@12345"

# Real-ish (approximate, illustrative) polygons in the Western Ghats, Maharashtra, India.
SITE_DEFINITIONS = [
    {
        "name": "Mulshi Forest Site",
        "description": "Native forest restoration parcel near Mulshi lake.",
        "geometry": {
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
        },
        "base_carbon_stock": 4200.0,
        "base_biodiversity": 0.62,
        "base_tree_cover": 58.0,
        "base_species": 74,
    },
    {
        "name": "Tamhini Biodiversity Site",
        "description": "High-rainfall biodiversity corridor in the Tamhini ghat.",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.4000, 18.4300],
                    [73.4230, 18.4300],
                    [73.4230, 18.4480],
                    [73.4000, 18.4480],
                    [73.4000, 18.4300],
                ]
            ],
        },
        "base_carbon_stock": 5100.0,
        "base_biodiversity": 0.71,
        "base_tree_cover": 66.0,
        "base_species": 96,
    },
    {
        "name": "Matheran Restoration Site",
        "description": "Degraded hillside undergoing active reforestation near Matheran.",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.2650, 18.9800],
                    [73.2850, 18.9800],
                    [73.2850, 18.9950],
                    [73.2650, 18.9950],
                    [73.2650, 18.9800],
                ]
            ],
        },
        "base_carbon_stock": 2800.0,
        "base_biodiversity": 0.48,
        "base_tree_cover": 39.0,
        "base_species": 51,
    },
]

YEARS = [2022, 2023, 2024, 2025, 2026]


def build_analytics_series(base_carbon, base_biodiversity, base_tree_cover, base_species):
    """
    Produces a deterministic, monotonically-improving-ish 5-year series so
    charts have a believable restoration trend. No randomness is used, so
    reseeding always produces identical numbers.
    """
    records = []
    for i, year in enumerate(YEARS):
        growth = i * 0.08  # steady annual improvement factor
        carbon_stock = round(base_carbon * (1 + growth), 2)
        carbon_sequestration = round(base_carbon * 0.04 * (1 + growth * 0.5), 2)
        biodiversity_index = round(min(0.95, base_biodiversity + i * 0.015), 4)
        tree_cover = round(min(95.0, base_tree_cover + i * 2.4), 2)
        species_count = base_species + i * 3

        records.append(
            SiteAnalytics(
                recorded_date=date(year, 6, 30),
                carbon_stock=carbon_stock,
                carbon_sequestration=carbon_sequestration,
                biodiversity_index=biodiversity_index,
                tree_cover_percentage=tree_cover,
                species_count=species_count,
            )
        )
    return records


def seed() -> None:
    Base.metadata.create_all(bind=engine)  # safety net if migrations haven't run
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                name="Darukaa Admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Created admin user: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print(f"Admin user already exists: {ADMIN_EMAIL}")

        project = db.query(Project).filter(Project.name == "Western Ghats Restoration").first()
        if not project:
            project = Project(
                name="Western Ghats Restoration",
                description=(
                    "Multi-site carbon and biodiversity restoration program across the "
                    "Western Ghats near Pune, Maharashtra. Demonstration project."
                ),
                created_by=admin.id,
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"Created project: {project.name}")
        else:
            print(f"Project already exists: {project.name}")

        for site_def in SITE_DEFINITIONS:
            existing_site = (
                db.query(Site).filter(Site.project_id == project.id, Site.name == site_def["name"]).first()
            )
            if existing_site:
                print(f"  Site already exists: {site_def['name']}")
                continue

            geometry = geojson_to_geometry(site_def["geometry"])
            site = Site(
                project_id=project.id,
                name=site_def["name"],
                description=site_def["description"],
                geometry=geometry,
                area_hectares=0,
            )
            db.add(site)
            db.flush()
            site.area_hectares = calculate_area_hectares(db, site.geometry)
            db.commit()
            db.refresh(site)
            print(f"  Created site: {site.name} ({site.area_hectares} ha)")

            analytics_records = build_analytics_series(
                site_def["base_carbon_stock"],
                site_def["base_biodiversity"],
                site_def["base_tree_cover"],
                site_def["base_species"],
            )
            for record in analytics_records:
                record.site_id = site.id
                db.add(record)
            db.commit()
            print(f"    Seeded {len(analytics_records)} years of demonstration analytics.")

        print("\nSeed complete. NOTE: analytics values are synthetic demonstration data only.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
