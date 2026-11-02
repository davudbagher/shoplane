"""add_parent_id_to_categories

Revision ID: 8c5c09ef15ba
Revises: c3d4e5f6g7h8
Create Date: 2026-04-21

Add parent_id column to categories table for hierarchical structure.
This enables subcategories (e.g., Men -> Pants/T-Shirts under Clothing).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8c5c09ef15ba'
down_revision = 'c3d4e5f6g7h8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add parent_id column (nullable - top-level categories have NULL)
    op.add_column('categories', sa.Column('parent_id', sa.Integer(), nullable=True))

    # Create self-referencing foreign key to categories.id
    op.create_foreign_key(
        'fk_categories_parent_id',
        'categories',
        'categories',
        ['parent_id'],
        ['id']
    )

    # Add index for faster hierarchy lookups
    op.create_index('ix_categories_parent_id', 'categories', ['parent_id'])


def downgrade() -> None:
    op.drop_index('ix_categories_parent_id', table_name='categories')
    op.drop_constraint('fk_categories_parent_id', 'categories', type_='foreignkey')
    op.drop_column('categories', 'parent_id')
