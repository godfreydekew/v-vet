"""Add record_birth fields and livestock_parentage table

Revision ID: e7f8a9b0c1d2
Revises: c5d6e7f8a9b0
Create Date: 2026-08-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7f8a9b0c1d2'
down_revision = 'c5d6e7f8a9b0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('whatsapp_user', sa.Column('active_birth_dam_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'whatsapp_user_active_birth_dam_id_fkey',
        'whatsapp_user', 'livestock',
        ['active_birth_dam_id'], ['id'],
        ondelete='SET NULL',
    )

    op.create_table(
        'livestock_parentage',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('child_id', sa.Uuid(), nullable=False),
        sa.Column('mother_id', sa.Uuid(), nullable=False),
        sa.Column('father_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['child_id'], ['livestock.id']),
        sa.ForeignKeyConstraint(['mother_id'], ['livestock.id']),
        sa.ForeignKeyConstraint(['father_id'], ['livestock.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('child_id'),
    )
    op.create_index(
        op.f('ix_livestock_parentage_child_id'), 'livestock_parentage', ['child_id'], unique=True,
    )
    op.create_index(
        op.f('ix_livestock_parentage_mother_id'), 'livestock_parentage', ['mother_id'], unique=False,
    )
    op.create_index(
        op.f('ix_livestock_parentage_father_id'), 'livestock_parentage', ['father_id'], unique=False,
    )


def downgrade():
    op.drop_index(op.f('ix_livestock_parentage_father_id'), table_name='livestock_parentage')
    op.drop_index(op.f('ix_livestock_parentage_mother_id'), table_name='livestock_parentage')
    op.drop_index(op.f('ix_livestock_parentage_child_id'), table_name='livestock_parentage')
    op.drop_table('livestock_parentage')

    op.drop_constraint('whatsapp_user_active_birth_dam_id_fkey', 'whatsapp_user', type_='foreignkey')
    op.drop_column('whatsapp_user', 'active_birth_dam_id')
