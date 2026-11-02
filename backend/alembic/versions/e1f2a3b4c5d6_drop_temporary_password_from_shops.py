"""drop temporary_password from shops

Revision ID: e1f2a3b4c5d6
Revises: 71ae82c0306c
Create Date: 2026-11-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1f2a3b4c5d6'
down_revision = '71ae82c0306c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # IF EXISTS: this column was added outside of Alembic, and may already have
    # been dropped by hand with docs/security_cleanup.sql
    op.execute("ALTER TABLE shops DROP COLUMN IF EXISTS temporary_password")


def downgrade() -> None:
    op.add_column('shops', sa.Column('temporary_password', sa.String(), nullable=True))
