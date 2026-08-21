"""Add active_birth_pending

Revision ID: h0a1b2c3d4e5
Revises: g9a0b1c2d3e4
Create Date: 2026-08-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h0a1b2c3d4e5'
down_revision = 'g9a0b1c2d3e4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('whatsapp_user', sa.Column('active_birth_pending', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('whatsapp_user', 'active_birth_pending')
