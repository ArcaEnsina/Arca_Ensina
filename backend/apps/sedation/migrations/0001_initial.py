import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("pacientes", "0001_initial"),
        ("protocols", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SedationConversion",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("source_drug", models.CharField(max_length=100)),
                ("target_drug", models.CharField(max_length=100)),
                (
                    "original_dose",
                    models.DecimalField(decimal_places=4, max_digits=12),
                ),
                (
                    "converted_dose",
                    models.DecimalField(decimal_places=4, max_digits=12),
                ),
                ("converted_dose_unit", models.CharField(max_length=20)),
                ("frequency", models.CharField(max_length=20)),
                (
                    "peso_kg",
                    models.DecimalField(decimal_places=4, max_digits=12),
                ),
                ("client_uuid", models.UUIDField(unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "panel_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="protocols.protocolversion",
                    ),
                ),
                (
                    "patient",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        to="pacientes.paciente",
                    ),
                ),
                (
                    "physician",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Conversão de Sedação",
                "verbose_name_plural": "Conversões de Sedação",
                "ordering": ["-created_at"],
            },
        ),
    ]
