from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.project import Project
from app.models.site import Site
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate, ProjectWithStats

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_owned_project(db: Session, project_id: int, current_user: User) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    if project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this project.")
    return project


@router.get("", response_model=list[ProjectWithStats])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(
            Project,
            func.count(Site.id).label("site_count"),
            func.coalesce(func.sum(Site.area_hectares), 0).label("total_area_hectares"),
        )
        .outerjoin(Site, Site.project_id == Project.id)
        .filter(Project.created_by == current_user.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
        .all()
    )

    results = []
    for project, site_count, total_area in rows:
        item = ProjectWithStats.model_validate(project)
        item.site_count = site_count
        item.total_area_hectares = round(float(total_area), 4)
        results.append(item)
    return results


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    project = Project(name=payload.name, description=payload.description, created_by=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return _get_owned_project(db, project_id, current_user)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(db, project_id, current_user)
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    project = _get_owned_project(db, project_id, current_user)
    db.delete(project)
    db.commit()
    return None
