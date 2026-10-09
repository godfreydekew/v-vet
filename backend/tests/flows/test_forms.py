"""Reading submitted WhatsApp forms through the models in app.models.flows."""

import pytest
from pydantic import ValidationError

from app.models.flows import RegisterAnimalForm


def test_register_animal_form_converts_text_values() -> None:
    form = RegisterAnimalForm.model_validate(
        {
            "name": " Bessie ",
            "breed": "",
            "gender": "female",
            "weight_kg": "250",
            "date_of_birth": "2024-01-15",
            "animal_photo": [{"id": "media-1"}],
        }
    )

    assert form.model_dump(mode="json") == {
        "name": "Bessie",
        "breed": None,
        "gender": "female",
        "weight_kg": 250.0,
        "date_of_birth": "2024-01-15",
        "animal_photo": [{"id": "media-1"}],
    }


def test_register_animal_form_allows_every_field_empty() -> None:
    form = RegisterAnimalForm.model_validate({"name": "", "weight_kg": "", "date_of_birth": ""})

    assert form.name is None
    assert form.weight_kg is None
    assert form.date_of_birth is None


@pytest.mark.parametrize(
    "data",
    [{"gender": "cow"}, {"weight_kg": "heavy"}, {"weight_kg": "-5"}, {"date_of_birth": "15/01/2024"}],
)
def test_register_animal_form_rejects_invalid_values(data: dict) -> None:
    with pytest.raises(ValidationError):
        RegisterAnimalForm.model_validate(data)
