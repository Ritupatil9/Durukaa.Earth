from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GeoJSONPolygon(BaseModel):
    type: Literal["Polygon"]
    coordinates: list[list[list[float]]]

    @field_validator("coordinates")
    @classmethod
    def validate_ring(cls, v: list[list[list[float]]]) -> list[list[list[float]]]:
        if not v or len(v[0]) < 4:
            raise ValueError("A polygon ring needs at least 4 coordinate pairs (closed ring).")
        if v[0][0] != v[0][-1]:
            raise ValueError("Polygon ring must be closed (first point == last point).")
        return v


class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    geometry: GeoJSONPolygon


class SiteUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    geometry: GeoJSONPolygon | None = None


class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    description: str | None
    area_hectares: float
    created_at: datetime
    updated_at: datetime
    geometry: dict[str, Any]


class MapFeatureProperties(BaseModel):
    id: int
    name: str
    project_id: int
    project_name: str
    area_hectares: float


class MapFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: dict[str, Any]
    properties: MapFeatureProperties


class MapFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[MapFeature]
