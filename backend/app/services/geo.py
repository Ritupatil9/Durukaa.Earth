"""
Geospatial helper functions built on real PostGIS functions.

Area calculation:
Polygon coordinates are stored as WGS84 (SRID 4326) degrees, which cannot be
treated as meters. We cast the geometry to `geography` (PostGIS's spheroid-
aware type) and call ST_Area on it, which computes an accurate area in
square meters on the WGS84 ellipsoid without needing a manual UTM zone
lookup. That figure is converted to hectares (1 ha = 10,000 m^2).
"""

import json
from typing import Any

from geoalchemy2.functions import ST_Area, ST_AsGeoJSON
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from sqlalchemy import select
from sqlalchemy.orm import Session

SQUARE_METERS_PER_HECTARE = 10_000


def geojson_to_geometry(geojson_geometry: dict[str, Any]):
    """Convert a GeoJSON Polygon dict into a WKBElement usable by GeoAlchemy2."""
    polygon = shape(geojson_geometry)
    return from_shape(polygon, srid=4326)


def geometry_to_geojson(db: Session, geometry) -> dict[str, Any]:
    """Ask PostGIS (ST_AsGeoJSON) to render a stored geometry back to GeoJSON."""
    result = db.execute(select(ST_AsGeoJSON(geometry))).scalar()
    return json.loads(result)


def calculate_area_hectares(db: Session, geometry) -> float:
    """Compute the true geodesic area of a polygon, in hectares, via PostGIS."""
    area_m2 = db.execute(select(ST_Area(geometry, True))).scalar()
    if area_m2 is None:
        return 0.0
    return round(area_m2 / SQUARE_METERS_PER_HECTARE, 4)
