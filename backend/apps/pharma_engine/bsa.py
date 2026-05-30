"""Cálculo de superfície corporal (BSA - Body Surface Area).

Módulo puro Python (apenas Decimal), sem dependências do Django.
"""

from decimal import Decimal


def bsa_mosteller(weight_kg, height_cm) -> Decimal:
    """Superfície corporal pela fórmula de Mosteller.

    SC(m²) = sqrt((altura_cm * peso_kg) / 3600)

    Ex: altura 100 cm, peso 16 kg -> sqrt((100 * 16) / 3600) = 0.6667 m²

    O resultado NÃO é arredondado aqui; o arredondamento final (0.01) é
    aplicado pelo consumidor após multiplicar pela prescrição (mg/m²), para
    preservar o comportamento histórico da calculadora.
    """
    weight = Decimal(str(weight_kg))
    height = Decimal(str(height_cm))
    if weight <= 0 or height <= 0:
        raise ValueError("Altura e peso devem ser maiores que zero.")
    return ((height * weight) / Decimal("3600")).sqrt()
