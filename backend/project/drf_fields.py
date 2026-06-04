"""Campos DRF compartilhados entre apps."""

from rest_framework import serializers


class CommaDecimalField(serializers.DecimalField):
    """DecimalField que aceita vírgula como separador decimal.

    O teclado numérico do iOS envia números com vírgula (ex.: "1,5"),
    que o Decimal do Python não interpreta. Normaliza para ponto antes de
    delegar para a validação padrão do DRF.
    """

    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.replace(",", ".")
        return super().to_internal_value(data)
