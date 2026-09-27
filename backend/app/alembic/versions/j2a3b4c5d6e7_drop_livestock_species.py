"""Drop livestock.species

V-Vet only tracks cattle, so the species column is no longer needed.

Revision ID: j2a3b4c5d6e7
Revises: i1a2b3c4d5e6
Create Date: 2026-09-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'j2a3b4c5d6e7'
down_revision = 'i1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('livestock', 'species')


def downgrade():
    # The original values are gone; every animal comes back as cattle.
    op.add_column(
        'livestock',
        sa.Column('species', sa.String(), nullable=False, server_default='cattle'),
    )
    op.alter_column('livestock', 'species', server_default=None)
