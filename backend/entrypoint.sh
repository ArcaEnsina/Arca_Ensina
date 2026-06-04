#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Loading protocol fixtures..."
python manage.py loaddata apps/protocols/fixtures/dengue_guiado.json
python manage.py loaddata apps/protocols/fixtures/sedacao_painel.json
echo "Protocol fixtures loaded."

echo "Loading sintomas..."
python manage.py loaddata apps/pacientes/fixtures/sintomas.json
echo "Sintomas loaded."

echo "Loading medications..."
python manage.py loaddata apps/medications/infos/medications.json
echo "Medications loaded."

echo "Collecting static files..."
python manage.py collectstatic --noinput

exec "$@"
