from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Polygon boundary in WGS84 (SRID 4326), as required by the spec.
    geometry = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)

    # Always computed server-side via PostGIS (see services/geo.py). Never
    # trusted from client input.
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project = relationship("Project", back_populates="sites")
    analytics = relationship(
        "SiteAnalytics",
        back_populates="site",
        cascade="all, delete-orphan",
        order_by="SiteAnalytics.recorded_date",
    )

    __table_args__ = (Index("ix_sites_geometry", "geometry", postgresql_using="gist"),)
