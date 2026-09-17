"""initial schema: postgis extension, users, projects, sites, site_analytics

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00

"""
from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_projects_id", "projects", ["id"])
    op.create_index("ix_projects_name", "projects", ["name"])
    op.create_index("ix_projects_created_by", "projects", ["created_by"])

    op.create_table(
        "sites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "geometry",
            geoalchemy2.Geometry(geometry_type="POLYGON", srid=4326),
            nullable=False,
        ),
        sa.Column("area_hectares", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_sites_id", "sites", ["id"])
    op.create_index("ix_sites_project_id", "sites", ["project_id"])
    op.create_index("ix_sites_geometry", "sites", ["geometry"], postgresql_using="gist")

    op.create_table(
        "site_analytics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("site_id", sa.Integer(), sa.ForeignKey("sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recorded_date", sa.Date(), nullable=False),
        sa.Column("carbon_stock", sa.Float(), nullable=False),
        sa.Column("carbon_sequestration", sa.Float(), nullable=False),
        sa.Column("biodiversity_index", sa.Float(), nullable=False),
        sa.Column("tree_cover_percentage", sa.Float(), nullable=False),
        sa.Column("species_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_site_analytics_id", "site_analytics", ["id"])
    op.create_index("ix_site_analytics_site_id", "site_analytics", ["site_id"])
    op.create_index("ix_site_analytics_site_date", "site_analytics", ["site_id", "recorded_date"])


def downgrade() -> None:
    op.drop_table("site_analytics")
    op.drop_table("sites")
    op.drop_table("projects")
    op.drop_table("users")
    op.execute("DROP EXTENSION IF EXISTS postgis")
