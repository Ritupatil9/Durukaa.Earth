from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SiteAnalyticsCreate(BaseModel):
    recorded_date: date
    carbon_stock: float = Field(ge=0)
    carbon_sequestration: float
    biodiversity_index: float = Field(ge=0, le=1)
    tree_cover_percentage: float = Field(ge=0, le=100)
    species_count: int = Field(ge=0)


class SiteAnalyticsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_id: int
    recorded_date: date
    carbon_stock: float
    carbon_sequestration: float
    biodiversity_index: float
    tree_cover_percentage: float
    species_count: int
    created_at: datetime


class SiteSummary(BaseModel):
    site_id: int
    site_name: str
    area_hectares: float
    latest_carbon_stock: float | None = None
    latest_biodiversity_index: float | None = None
    latest_tree_cover_percentage: float | None = None
    latest_species_count: int | None = None
    latest_recorded_date: date | None = None
    carbon_change: float | None = None
    carbon_change_percentage: float | None = None
    biodiversity_change: float | None = None
    biodiversity_change_percentage: float | None = None
    data_note: str = (
        "Demonstration analytics data for illustration purposes only; not real environmental measurements."
    )
