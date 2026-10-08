"""Add conversation_state table

One row per attempt at a multi-step WhatsApp flow (starting with animal
registration), so a farmer's place in a flow is stored in one place.

Revision ID: k3a4b5c6d7e8
Revises: j2a3b4c5d6e7
Create Date: 2026-10-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


revision = 'k3a4b5c6d7e8'
down_revision = 'j2a3b4c5d6e7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'conversation_state',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('whatsapp_user_id', sa.Uuid(), nullable=False),
        sa.Column('flow', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('step', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('invalid_inputs', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['whatsapp_user_id'], ['whatsapp_user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_conversation_state_whatsapp_user_id', 'conversation_state', ['whatsapp_user_id'])
    op.create_index('ix_conversation_state_flow', 'conversation_state', ['flow'])
    # A farmer can have only one active flow at a time.
    op.create_index(
        'ix_conversation_state_one_active_per_user',
        'conversation_state',
        ['whatsapp_user_id'],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )


def downgrade():
    op.drop_index('ix_conversation_state_one_active_per_user', table_name='conversation_state')
    op.drop_index('ix_conversation_state_flow', table_name='conversation_state')
    op.drop_index('ix_conversation_state_whatsapp_user_id', table_name='conversation_state')
    op.drop_table('conversation_state')
