"""Add record_death fields

Revision ID: c5d6e7f8a9b0
Revises: b4c5d6e7f8a9
Create Date: 2026-08-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'c5d6e7f8a9b0'
down_revision = 'b4c5d6e7f8a9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('livestock', sa.Column('date_of_death', sa.Date(), nullable=True))
    op.add_column('livestock', sa.Column('cause_of_death', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_death_animal_id', sa.Uuid(), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_death_cause', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.create_foreign_key(
        'whatsapp_user_active_death_animal_id_fkey',
        'whatsapp_user', 'livestock',
        ['active_death_animal_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade():
    op.drop_constraint('whatsapp_user_active_death_animal_id_fkey', 'whatsapp_user', type_='foreignkey')
    op.drop_column('whatsapp_user', 'active_death_cause')
    op.drop_column('whatsapp_user', 'active_death_animal_id')
    op.drop_column('livestock', 'cause_of_death')
    op.drop_column('livestock', 'date_of_death')
