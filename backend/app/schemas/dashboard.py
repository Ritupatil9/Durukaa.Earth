from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_projects: int
    total_sites: int
    total_area_hectares: float
    average_biodiversity_index: float | None = None
    total_carbon_stock: float
