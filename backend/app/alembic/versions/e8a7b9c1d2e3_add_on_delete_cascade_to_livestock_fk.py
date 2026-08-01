"""Add ON DELETE CASCADE and SET NULL to livestock foreign keys

Revision ID: e8a7b9c1d2e3
Revises: c9f82d3e4b1a
Create Date: 2026-08-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e8a7b9c1d2e3'
down_revision = 'c9f82d3e4b1a'
branch_labels = None
depends_on = None


def upgrade():
    # HealthObservation -> Livestock
    op.execute("ALTER TABLE health_observation DROP CONSTRAINT IF EXISTS health_observation_livestock_id_fkey")
    op.create_foreign_key(
        'health_observation_livestock_id_fkey',
        'health_observation',
        'livestock',
        ['livestock_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Treatment -> Livestock
    op.execute("ALTER TABLE treatment DROP CONSTRAINT IF EXISTS treatment_livestock_id_fkey")
    op.create_foreign_key(
        'treatment_livestock_id_fkey',
        'treatment',
        'livestock',
        ['livestock_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Vaccination -> Livestock
    op.execute("ALTER TABLE vaccination DROP CONSTRAINT IF EXISTS vaccination_livestock_id_fkey")
    op.create_foreign_key(
        'vaccination_livestock_id_fkey',
        'vaccination',
        'livestock',
        ['livestock_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # LivestockImage -> Livestock
    op.execute("ALTER TABLE livestock_image DROP CONSTRAINT IF EXISTS livestock_image_livestock_id_fkey")
    op.create_foreign_key(
        'livestock_image_livestock_id_fkey',
        'livestock_image',
        'livestock',
        ['livestock_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # VetRequest -> Livestock
    op.execute("ALTER TABLE vet_request DROP CONSTRAINT IF EXISTS vet_request_livestock_id_fkey")
    op.create_foreign_key(
        'vet_request_livestock_id_fkey',
        'vet_request',
        'livestock',
        ['livestock_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # VetResponse -> VetRequest
    op.execute("ALTER TABLE vet_response DROP CONSTRAINT IF EXISTS vet_response_vet_request_id_fkey")
    op.create_foreign_key(
        'vet_response_vet_request_id_fkey',
        'vet_response',
        'vet_request',
        ['vet_request_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # WhatsAppUser -> Livestock
    op.execute("ALTER TABLE whatsapp_user DROP CONSTRAINT IF EXISTS whatsapp_user_active_sickness_animal_id_fkey")
    op.create_foreign_key(
        'whatsapp_user_active_sickness_animal_id_fkey',
        'whatsapp_user',
        'livestock',
        ['active_sickness_animal_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    op.execute("ALTER TABLE health_observation DROP CONSTRAINT IF EXISTS health_observation_livestock_id_fkey")
    op.create_foreign_key('health_observation_livestock_id_fkey', 'health_observation', 'livestock', ['livestock_id'], ['id'])

    op.execute("ALTER TABLE treatment DROP CONSTRAINT IF EXISTS treatment_livestock_id_fkey")
    op.create_foreign_key('treatment_livestock_id_fkey', 'treatment', 'livestock', ['livestock_id'], ['id'])

    op.execute("ALTER TABLE vaccination DROP CONSTRAINT IF EXISTS vaccination_livestock_id_fkey")
    op.create_foreign_key('vaccination_livestock_id_fkey', 'vaccination', 'livestock', ['livestock_id'], ['id'])

    op.execute("ALTER TABLE livestock_image DROP CONSTRAINT IF EXISTS livestock_image_livestock_id_fkey")
    op.create_foreign_key('livestock_image_livestock_id_fkey', 'livestock_image', 'livestock', ['livestock_id'], ['id'])

    op.execute("ALTER TABLE vet_request DROP CONSTRAINT IF EXISTS vet_request_livestock_id_fkey")
    op.create_foreign_key('vet_request_livestock_id_fkey', 'vet_request', 'livestock', ['livestock_id'], ['id'])

    op.execute("ALTER TABLE vet_response DROP CONSTRAINT IF EXISTS vet_response_vet_request_id_fkey")
    op.create_foreign_key('vet_response_vet_request_id_fkey', 'vet_response', 'vet_request', ['vet_request_id'], ['id'])

    op.execute("ALTER TABLE whatsapp_user DROP CONSTRAINT IF EXISTS whatsapp_user_active_sickness_animal_id_fkey")
    op.create_foreign_key('whatsapp_user_active_sickness_animal_id_fkey', 'whatsapp_user', 'livestock', ['active_sickness_animal_id'], ['id'])
