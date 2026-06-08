#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Running Python parity generator ==="
source /tmp/parity-venv/bin/activate 2>/dev/null || true
cd "$ROOT/backend"
DJANGO_SETTINGS_MODULE=project.settings \
DJANGO_SECRET_KEY=ci-test-secret-key \
python manage.py test apps.calculator.tests.test_parity -v 2
cd "$ROOT"

echo "=== Running JS parity test ==="
cd "$ROOT/frontend"
npx vitest run tests/parity/calculator.test.ts
cd "$ROOT"

echo "=== Parity suite passed ==="
