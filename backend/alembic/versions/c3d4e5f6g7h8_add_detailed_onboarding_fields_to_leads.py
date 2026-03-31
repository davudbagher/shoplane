"""add_detailed_onboarding_fields_to_leads

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-03-30 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns for detailed onboarding
    op.add_column('leads', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('shop_name_az', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('subdomain_preference', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('instagram_handle', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('location_address', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('google_maps_link', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('business_description', sa.Text(), nullable=True))
    op.add_column('leads', sa.Column('logo_url', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('banner_url', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('primary_color', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('secondary_color', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('current_revenue', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('employee_count', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('currently_selling_online', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('leads', sa.Column('other_platforms', sa.String(), nullable=True))
    op.add_column('leads', sa.Column('source', sa.String(), nullable=True, server_default='landing_page'))
    op.add_column('leads', sa.Column('screening_status', sa.String(), nullable=True, server_default='pending'))


def downgrade() -> None:
    op.drop_column('leads', 'screening_status')
    op.drop_column('leads', 'source')
    op.drop_column('leads', 'other_platforms')
    op.drop_column('leads', 'employee_count')
    op.drop_column('leads', 'current_revenue')
    op.drop_column('leads', 'secondary_color')
    op.drop_column('leads', 'primary_color')
    op.drop_column('leads', 'banner_url')
    op.drop_column('leads', 'logo_url')
    op.drop_column('leads', 'business_description')
    op.drop_column('leads', 'google_maps_link')
    op.drop_column('leads', 'location_address')
    op.drop_column('leads', 'instagram_handle')
    op.drop_column('leads', 'subdomain_preference')
    op.drop_column('leads', 'shop_name_az')
    op.drop_column('leads', 'phone')
