"""Cascade deletes from user (and everything below it)

Deleting a user now removes their farms, animals, health records, vet requests,
vet profile and WhatsApp account at the database level.

The foreign keys below user (farm -> livestock -> parentage/triage/follow-ups, and
whatsapp_user -> triage/follow-ups) cascade too, otherwise deleting a user would
still be blocked one level down.

Two columns use SET NULL instead of CASCADE because the row belongs to someone else:
  - vet_request.vet_id: another farmer's request stays, it just becomes unassigned.
  - livestock_parentage.father_id: another farmer's calf keeps its record, the sire link is cleared.

Revision ID: i1a2b3c4d5e6
Revises: h0a1b2c3d4e5
Create Date: 2026-09-27 00:00:00.000000

"""
from alembic import op


revision = 'i1a2b3c4d5e6'
down_revision = 'h0a1b2c3d4e5'
branch_labels = None
depends_on = None


# (table, column, referenced table, ON DELETE rule)
FOREIGN_KEYS = [
    # Direct references to user
    ("farm", "farmer_id", "user", "CASCADE"),
    ("health_observation", "logged_by", "user", "CASCADE"),
    ("treatment", "logged_by", "user", "CASCADE"),
    ("vaccination", "logged_by", "user", "CASCADE"),
    ("vet_profile", "user_id", "user", "CASCADE"),
    ("vet_request", "farmer_id", "user", "CASCADE"),
    ("vet_request", "vet_id", "user", "SET NULL"),
    ("vet_response", "vet_id", "user", "CASCADE"),
    ("whatsapp_user", "linked_user_id", "user", "CASCADE"),
    # Below farm
    ("livestock", "farm_id", "farm", "CASCADE"),
    ("vet_request", "farm_id", "farm", "CASCADE"),
    # Below livestock
    ("livestock_parentage", "child_id", "livestock", "CASCADE"),
    ("livestock_parentage", "mother_id", "livestock", "CASCADE"),
    ("livestock_parentage", "father_id", "livestock", "SET NULL"),
    ("triage_session", "livestock_id", "livestock", "CASCADE"),
    ("health_observation_follow_up", "livestock_id", "livestock", "CASCADE"),
    # Below health_observation
    ("health_observation_follow_up", "health_observation_id", "health_observation", "CASCADE"),
    # Below whatsapp_user
    ("triage_session", "whatsapp_user_id", "whatsapp_user", "CASCADE"),
    ("health_observation_follow_up", "whatsapp_user_id", "whatsapp_user", "CASCADE"),
]


def _constraint_name(table: str, column: str) -> str:
    # Postgres' default name, which is what the existing constraints use.
    return f"{table}_{column}_fkey"


def upgrade():
    for table, column, referenced_table, on_delete in FOREIGN_KEYS:
        name = _constraint_name(table, column)
        op.execute(f'ALTER TABLE "{table}" DROP CONSTRAINT IF EXISTS {name}')
        op.create_foreign_key(name, table, referenced_table, [column], ["id"], ondelete=on_delete)


def downgrade():
    # Back to the previous behaviour: no ON DELETE rule (NO ACTION).
    for table, column, referenced_table, _on_delete in FOREIGN_KEYS:
        name = _constraint_name(table, column)
        op.execute(f'ALTER TABLE "{table}" DROP CONSTRAINT IF EXISTS {name}')
        op.create_foreign_key(name, table, referenced_table, [column], ["id"])
