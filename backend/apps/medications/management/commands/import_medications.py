#script para importar medicamentos de um arquivo JSON (claude)

import json
from django.core.management.base import BaseCommand
from apps.medications.models import Medication

class Command(BaseCommand):
    help = 'Importa medicamentos de um arquivo JSON'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str)

    def handle(self, *args, **options):
        with open(options['json_file'], encoding='utf-8') as f:
            data = json.load(f)

        created = 0
        updated = 0

        for item in data:
            fields = item['fields']
            print(f"Importando: {fields.get('name', 'SEM NOME')}")
            _, was_created = Medication.objects.update_or_create(
                name=fields['name'],
                defaults={
                    'category':            fields.get('type', ''),
                    'description':         fields.get('description', ''),
                    'prescription':        fields['prescription'],
                    'frequency_hours':     fields['frequency_hours'],
                    'min_dose_mg_kg':      fields.get('min_dose_mg_kg'),
                    'max_dose_mg_kg':      fields.get('max_dose_mg_kg'),
                    'max_absolute_dose_mg': fields.get('max_absolute_dose_mg'),
                    'concentration_mg':    fields.get('concentration_mg'),
                    'concentration_ml':    fields.get('concentration_ml'),
                    'limits_by_age':       fields.get('limits_by_age'),
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Importação concluída: {created} criados, {updated} atualizados.'
            )
        )