"""Drop orphaned active_new_calf_id column

Revision ID: g9a0b1c2d3e4
Revises: e7f8a9b0c1d2
Create Date: 2026-08-12 00:00:00.000000

Cleans up a column that was added then abandoned in the same session —
the design moved to reusing register_animal's Flow for calf details
instead of a plain-text name-capture pin, so this was never referenced
by any model or code past its own migration.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g9a0b1c2d3e4'
down_revision = 'e7f8a9b0c1d2'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE whatsapp_user DROP CONSTRAINT IF EXISTS whatsapp_user_active_new_calf_id_fkey")
    op.execute("ALTER TABLE whatsapp_user DROP COLUMN IF EXISTS active_new_calf_id")


def downgrade():
    op.add_column('whatsapp_user', sa.Column('active_new_calf_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'whatsapp_user_active_new_calf_id_fkey',
        'whatsapp_user', 'livestock',
        ['active_new_calf_id'], ['id'],
        ondelete='SET NULL',
    )
