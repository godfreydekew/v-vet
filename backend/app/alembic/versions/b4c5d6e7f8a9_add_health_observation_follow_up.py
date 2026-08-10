"""Add health_observation_follow_up table

Revision ID: b4c5d6e7f8a9
Revises: a3b4c5d6e7f8
Create Date: 2026-08-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'b4c5d6e7f8a9'
down_revision = 'a3b4c5d6e7f8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'health_observation_follow_up',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('health_observation_id', sa.Uuid(), nullable=False),
        sa.Column('livestock_id', sa.Uuid(), nullable=False),
        sa.Column('whatsapp_user_id', sa.Uuid(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('outcome', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['health_observation_id'], ['health_observation.id'], ),
        sa.ForeignKeyConstraint(['livestock_id'], ['livestock.id'], ),
        sa.ForeignKeyConstraint(['whatsapp_user_id'], ['whatsapp_user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_health_observation_follow_up_health_observation_id'),
        'health_observation_follow_up', ['health_observation_id'], unique=False,
    )
    op.create_index(
        op.f('ix_health_observation_follow_up_livestock_id'),
        'health_observation_follow_up', ['livestock_id'], unique=False,
    )
    op.create_index(
        op.f('ix_health_observation_follow_up_whatsapp_user_id'),
        'health_observation_follow_up', ['whatsapp_user_id'], unique=False,
    )


def downgrade():
    op.drop_index(op.f('ix_health_observation_follow_up_whatsapp_user_id'), table_name='health_observation_follow_up')
    op.drop_index(op.f('ix_health_observation_follow_up_livestock_id'), table_name='health_observation_follow_up')
    op.drop_index(op.f('ix_health_observation_follow_up_health_observation_id'), table_name='health_observation_follow_up')
    op.drop_table('health_observation_follow_up')
