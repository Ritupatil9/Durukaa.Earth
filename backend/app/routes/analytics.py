from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User
from app.schemas.analytics import SiteAnalyticsCreate, SiteAnalyticsOut, SiteSummary

router = APIRouter(tags=["analytics"])


def _site_or_404(db: Session, site_id: int, current_user: User) -> Site:
    site = db.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
    if site.project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this site.")
    return site


@router.get("/sites/{site_id}/analytics", response_model=list[SiteAnalyticsOut])
def list_analytics(
    site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _site_or_404(db, site_id, current_user)
    records = (
        db.query(SiteAnalytics)
        .filter(SiteAnalytics.site_id == site_id)
        .order_by(SiteAnalytics.recorded_date.asc())
        .all()
    )
    return records


@router.post(
    "/sites/{site_id}/analytics", response_model=SiteAnalyticsOut, status_code=status.HTTP_201_CREATED
)
def create_analytics(
    site_id: int,
    payload: SiteAnalyticsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _site_or_404(db, site_id, current_user)
    record = SiteAnalytics(site_id=site_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/sites/{site_id}/summary", response_model=SiteSummary)
def site_summary(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _site_or_404(db, site_id, current_user)
    records = (
        db.query(SiteAnalytics)
        .filter(SiteAnalytics.site_id == site_id)
        .order_by(SiteAnalytics.recorded_date.asc())
        .all()
    )

    summary = SiteSummary(site_id=site.id, site_name=site.name, area_hectares=site.area_hectares)

    if records:
        latest = records[-1]
        summary.latest_carbon_stock = latest.carbon_stock
        summary.latest_biodiversity_index = latest.biodiversity_index
        summary.latest_tree_cover_percentage = latest.tree_cover_percentage
        summary.latest_species_count = latest.species_count
        summary.latest_recorded_date = latest.recorded_date

        if len(records) > 1:
            first = records[0]
            summary.carbon_change = round(latest.carbon_stock - first.carbon_stock, 4)
            if first.carbon_stock:
                summary.carbon_change_percentage = round(
                    (latest.carbon_stock - first.carbon_stock) / first.carbon_stock * 100, 2
                )
            summary.biodiversity_change = round(latest.biodiversity_index - first.biodiversity_index, 4)
            if first.biodiversity_index:
                summary.biodiversity_change_percentage = round(
                    (latest.biodiversity_index - first.biodiversity_index) / first.biodiversity_index * 100, 2
                )

    return summary
