"""Add pending_animal_photo_url to whatsapp_user

Revision ID: c9f82d3e4b1a
Revises: 71934b35522e
Create Date: 2026-07-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9f82d3e4b1a'
down_revision = '71934b35522e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('whatsapp_user', sa.Column('pending_animal_photo_url', sa.String(length=1024), nullable=True))


def downgrade():
    op.drop_column('whatsapp_user', 'pending_animal_photo_url')
