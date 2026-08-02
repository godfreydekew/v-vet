"""Add triage_session table

Revision ID: f1a2b3c4d5e6
Revises: e8a7b9c1d2e3
Create Date: 2026-07-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'e8a7b9c1d2e3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'triage_session',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('whatsapp_user_id', sa.Uuid(), nullable=False),
        sa.Column('livestock_id', sa.Uuid(), nullable=False),
        sa.Column('current_question_id', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=True),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['whatsapp_user_id'], ['whatsapp_user.id'], ),
        sa.ForeignKeyConstraint(['livestock_id'], ['livestock.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_triage_session_whatsapp_user_id'), 'triage_session', ['whatsapp_user_id'], unique=False)
    op.create_index(op.f('ix_triage_session_livestock_id'), 'triage_session', ['livestock_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_triage_session_livestock_id'), table_name='triage_session')
    op.drop_index(op.f('ix_triage_session_whatsapp_user_id'), table_name='triage_session')
    op.drop_table('triage_session')
