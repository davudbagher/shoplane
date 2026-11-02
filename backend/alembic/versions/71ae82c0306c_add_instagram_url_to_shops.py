"""add_instagram_url_to_shops

Revision ID: 71ae82c0306c
Revises: 8c5c09ef15ba
Create Date: 2026-04-22

Add instagram_url column to shops table so storefron can display the shop's Instagram profile link.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '71ae82c0306c'
down_revision = '8c5c09ef15ba'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('shops', sa.Column('instagram_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('shops', 'instagram_url')
