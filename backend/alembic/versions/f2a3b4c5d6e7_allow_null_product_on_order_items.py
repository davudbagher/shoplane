"""allow null product_id on order_items

Lets merchants delete a product that has past orders. The order keeps its
product_name and price snapshot.

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-11-02 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f2a3b4c5d6e7'
down_revision = 'e1f2a3b4c5d6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('order_items', 'product_id', existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column('order_items', 'product_id', existing_type=sa.Integer(), nullable=False)
