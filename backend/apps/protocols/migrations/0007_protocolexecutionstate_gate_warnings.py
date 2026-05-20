from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("protocols", "0006_protocolexecution_client_uuid_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="protocolexecutionstate",
            name="gate_warnings",
            field=models.JSONField(
                blank=True,
                default=list,
                verbose_name="Avisos de gate avaliados",
            ),
        ),
    ]
