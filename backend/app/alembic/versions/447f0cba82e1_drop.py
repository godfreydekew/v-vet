"""Drop the columns the old farmer agent used to track progress

Flows now keep their progress in conversation_state, so these columns on
whatsapp_user (and the reminder column on triage_session) are no longer used.

Revision ID: 447f0cba82e1
Revises: k3a4b5c6d7e8
Create Date: 2026-10-09 21:30:27.317624

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '447f0cba82e1'
down_revision = 'k3a4b5c6d7e8'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint('whatsapp_user_active_sickness_animal_id_fkey', 'whatsapp_user', type_='foreignkey')
    op.drop_constraint('whatsapp_user_active_death_animal_id_fkey', 'whatsapp_user', type_='foreignkey')
    op.drop_constraint('whatsapp_user_active_birth_dam_id_fkey', 'whatsapp_user', type_='foreignkey')

    op.drop_column('whatsapp_user', 'is_adding_animal')
    op.drop_column('whatsapp_user', 'pending_animal_photo_url')
    op.drop_column('whatsapp_user', 'active_sickness_animal_id')
    op.drop_column('whatsapp_user', 'active_sickness_updated_at')
    op.drop_column('whatsapp_user', 'active_sickness_reminded_at')
    op.drop_column('whatsapp_user', 'active_death_animal_id')
    op.drop_column('whatsapp_user', 'active_death_cause')
    op.drop_column('whatsapp_user', 'active_birth_dam_id')
    op.drop_column('whatsapp_user', 'active_birth_pending')

    op.drop_column('triage_session', 'reminded_at')


def downgrade():
    # The columns come back empty: the values they held are not restored.
    op.add_column('triage_session', sa.Column('reminded_at', sa.DateTime(timezone=True), nullable=True))

    op.add_column('whatsapp_user', sa.Column('active_birth_pending', sa.JSON(), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_birth_dam_id', sa.Uuid(), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_death_cause', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_death_animal_id', sa.Uuid(), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_sickness_reminded_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_sickness_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('whatsapp_user', sa.Column('active_sickness_animal_id', sa.Uuid(), nullable=True))
    op.add_column('whatsapp_user', sa.Column('pending_animal_photo_url', sa.String(length=1024), nullable=True))
    op.add_column('whatsapp_user', sa.Column('is_adding_animal', sa.Boolean(), nullable=False, server_default='false'))

    op.create_foreign_key(
        'whatsapp_user_active_birth_dam_id_fkey', 'whatsapp_user', 'livestock',
        ['active_birth_dam_id'], ['id'], ondelete='SET NULL',
    )
    op.create_foreign_key(
        'whatsapp_user_active_death_animal_id_fkey', 'whatsapp_user', 'livestock',
        ['active_death_animal_id'], ['id'], ondelete='SET NULL',
    )
    op.create_foreign_key(
        'whatsapp_user_active_sickness_animal_id_fkey', 'whatsapp_user', 'livestock',
        ['active_sickness_animal_id'], ['id'], ondelete='SET NULL',
    )
