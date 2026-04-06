"""create livestock image table and migrate data

Revision ID: f3b1ce8a729d
Revises: d4a1f1c9287a
Create Date: 2026-04-06 13:30:00.000000

"""
import uuid

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'f3b1ce8a729d'
down_revision = 'd4a1f1c9287a'
branch_labels = None
depends_on = None


livestock_image_table = sa.table(
    'livestock_image',
    sa.column('id', sa.Uuid()),
    sa.column('livestock_id', sa.Uuid()),
    sa.column('image_url', sa.String()),
    sa.column('ai_analysis', sa.String()),
    sa.column('is_primary', sa.Boolean()),
)


def upgrade():
    op.create_table(
        'livestock_image',
        sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=1024), nullable=False),
        sa.Column('ai_analysis', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('livestock_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['livestock_id'], ['livestock.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            """
            SELECT id, image_url
            FROM livestock
            WHERE image_url IS NOT NULL AND image_url <> ''
            """
        )
    ).fetchall()

    if rows:
        op.bulk_insert(
            livestock_image_table,
            [
                {
                    'id': uuid.uuid4(),
                    'livestock_id': row.id,
                    'image_url': row.image_url,
                    'ai_analysis': None,
                    'is_primary': True,
                }
                for row in rows
            ],
        )

    op.drop_column('livestock', 'image_url')


def downgrade():
    op.add_column('livestock', sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            """
            SELECT livestock_id, image_url
            FROM livestock_image
            WHERE is_primary = true
            """
        )
    ).fetchall()

    for row in rows:
        bind.execute(
            sa.text(
                """
                UPDATE livestock
                SET image_url = :image_url
                WHERE id = :livestock_id
                """
            ),
            {"image_url": row.image_url, "livestock_id": row.livestock_id},
        )

    op.drop_table('livestock_image')
