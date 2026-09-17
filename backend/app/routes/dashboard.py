from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.project import Project
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_projects = (
        db.query(func.count(Project.id)).filter(Project.created_by == current_user.id).scalar() or 0
    )

    site_query = (
        db.query(Site)
        .join(Project, Project.id == Site.project_id)
        .filter(Project.created_by == current_user.id)
    )
    total_sites = site_query.count()
    total_area = (
        db.query(func.coalesce(func.sum(Site.area_hectares), 0))
        .join(Project, Project.id == Site.project_id)
        .filter(Project.created_by == current_user.id)
        .scalar()
        or 0
    )

    site_ids = [s.id for s in site_query.all()]

    avg_biodiversity = None
    total_carbon_stock = 0.0
    if site_ids:
        # latest analytics row per site
        latest_per_site = {}
        rows = (
            db.query(SiteAnalytics)
            .filter(SiteAnalytics.site_id.in_(site_ids))
            .order_by(SiteAnalytics.site_id, SiteAnalytics.recorded_date.asc())
            .all()
        )
        for row in rows:
            latest_per_site[row.site_id] = row  # keeps overwriting -> ends on latest date

        if latest_per_site:
            bio_values = [r.biodiversity_index for r in latest_per_site.values()]
            avg_biodiversity = round(sum(bio_values) / len(bio_values), 4)
            total_carbon_stock = round(sum(r.carbon_stock for r in latest_per_site.values()), 2)

    return DashboardSummary(
        total_projects=total_projects,
        total_sites=total_sites,
        total_area_hectares=round(float(total_area), 4),
        average_biodiversity_index=avg_biodiversity,
        total_carbon_stock=total_carbon_stock,
    )
