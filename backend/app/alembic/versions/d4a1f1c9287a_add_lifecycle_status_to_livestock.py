"""add lifecycle_status to livestock

Revision ID: d4a1f1c9287a
Revises: 2c6c69b12079
Create Date: 2026-04-06 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'd4a1f1c9287a'
down_revision = '2c6c69b12079'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'livestock',
        sa.Column(
            'lifecycle_status',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='active',
        ),
    )


def downgrade():
    op.drop_column('livestock', 'lifecycle_status')
