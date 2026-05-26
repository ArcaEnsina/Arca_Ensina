from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("research", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="researchdatapoint",
            name="indicacao_clinica",
            field=models.TextField(
                blank=True,
                null=True,
                help_text="Indicação clínica livre descrita ao usar a calculadora.",
            ),
        ),
        migrations.AddField(
            model_name="researchdatapoint",
            name="seguiu_protocolo_integralmente",
            field=models.BooleanField(
                null=True,
                blank=True,
                help_text="Null = não respondeu; True/False = resposta explícita.",
            ),
        ),
        migrations.AddField(
            model_name="researchdatapoint",
            name="desfecho_esperado",
            field=models.CharField(
                max_length=200,
                blank=True,
                null=True,
                help_text="Desfecho clínico esperado informado pelo profissional.",
            ),
        ),
    ]