#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Usage: $0 <migration message>"
  exit 1
fi

cd "$(dirname "$0")/.."
.venv/bin/alembic revision --autogenerate -m "$1"
.venv/bin/alembic upgrade head