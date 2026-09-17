from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SiteAnalytics(Base):
    __tablename__ = "site_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True
    )

    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)

    carbon_stock: Mapped[float] = mapped_column(Float, nullable=False)  # tCO2e
    carbon_sequestration: Mapped[float] = mapped_column(Float, nullable=False)  # tCO2e/yr
    biodiversity_index: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1 scale
    tree_cover_percentage: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    species_count: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    site = relationship("Site", back_populates="analytics")

    __table_args__ = (Index("ix_site_analytics_site_date", "site_id", "recorded_date"),)
