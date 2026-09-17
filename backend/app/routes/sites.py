from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.site import (
    MapFeature,
    MapFeatureCollection,
    MapFeatureProperties,
    SiteCreate,
    SiteOut,
    SiteUpdate,
)
from app.services.geo import calculate_area_hectares, geojson_to_geometry, geometry_to_geojson

router = APIRouter(tags=["sites"])


def _project_or_404(db: Session, project_id: int, current_user: User) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    if project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this project.")
    return project


def _site_or_404(db: Session, site_id: int, current_user: User) -> Site:
    site = db.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
    if site.project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this site.")
    return site


def _serialize_site(db: Session, site: Site) -> SiteOut:
    geojson_geom = geometry_to_geojson(db, site.geometry)
    return SiteOut(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        description=site.description,
        area_hectares=site.area_hectares,
        created_at=site.created_at,
        updated_at=site.updated_at,
        geometry=geojson_geom,
    )


@router.get("/projects/{project_id}/sites", response_model=list[SiteOut])
def list_sites(
    project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _project_or_404(db, project_id, current_user)
    sites = db.query(Site).filter(Site.project_id == project_id).order_by(Site.created_at.desc()).all()
    return [_serialize_site(db, s) for s in sites]


@router.post("/projects/{project_id}/sites", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    project_id: int,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _project_or_404(db, project_id, current_user)

    geometry = geojson_to_geometry(payload.geometry.model_dump())
    site = Site(
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        geometry=geometry,
        area_hectares=0,
    )
    db.add(site)
    db.flush()  # geometry needs to exist server-side before ST_Area can run on it
    site.area_hectares = calculate_area_hectares(db, site.geometry)
    db.commit()
    db.refresh(site)
    return _serialize_site(db, site)


@router.get("/sites/map", response_model=MapFeatureCollection)
def sites_map(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """GeoJSON FeatureCollection of every site the current user owns, for Mapbox."""
    rows = (
        db.query(Site, Project.name.label("project_name"))
        .join(Project, Project.id == Site.project_id)
        .filter(Project.created_by == current_user.id)
        .all()
    )

    features = []
    for site, project_name in rows:
        features.append(
            MapFeature(
                geometry=geometry_to_geojson(db, site.geometry),
                properties=MapFeatureProperties(
                    id=site.id,
                    name=site.name,
                    project_id=site.project_id,
                    project_name=project_name,
                    area_hectares=site.area_hectares,
                ),
            )
        )
    return MapFeatureCollection(features=features)


@router.get("/sites/{site_id}", response_model=SiteOut)
def get_site(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _site_or_404(db, site_id, current_user)
    return _serialize_site(db, site)


@router.put("/sites/{site_id}", response_model=SiteOut)
def update_site(
    site_id: int,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = _site_or_404(db, site_id, current_user)

    if payload.name is not None:
        site.name = payload.name
    if payload.description is not None:
        site.description = payload.description
    if payload.geometry is not None:
        site.geometry = geojson_to_geometry(payload.geometry.model_dump())
        db.flush()
        site.area_hectares = calculate_area_hectares(db, site.geometry)

    db.commit()
    db.refresh(site)
    return _serialize_site(db, site)


@router.delete("/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _site_or_404(db, site_id, current_user)
    db.delete(site)
    db.commit()
    return None
