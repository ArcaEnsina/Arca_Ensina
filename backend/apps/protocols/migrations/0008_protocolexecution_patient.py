from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("protocols", "0007_protocolexecutionstate_gate_warnings"),
        ("pacientes", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="protocolexecution",
            name="patient",
            field=models.ForeignKey(
                to="pacientes.paciente",
                on_delete=models.PROTECT,
                null=True,
                blank=True,
                related_name="protocol_executions",
                verbose_name="Paciente",
            ),
        ),
    ]
