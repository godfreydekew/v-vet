"""Add sickness follow-up reminder columns

Revision ID: a3b4c5d6e7f8
Revises: f1a2b3c4d5e6
Create Date: 2026-07-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3b4c5d6e7f8'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('triage_session', sa.Column('reminded_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_sickness_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_sickness_reminded_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('whatsapp_user', 'active_sickness_reminded_at')
    op.drop_column('whatsapp_user', 'active_sickness_updated_at')
    op.drop_column('triage_session', 'reminded_at')
