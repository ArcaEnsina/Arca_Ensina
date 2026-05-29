"""Conversão de dose (mg) para volume (mL) a partir da concentração.

Módulo puro Python (apenas Decimal), sem dependências do Django.
"""

from decimal import ROUND_HALF_UP, Decimal

_CENT = Decimal("0.01")


def dose_to_volume_ml(dose_mg, concentration_mg, concentration_ml) -> Decimal:
    """Converte uma dose em mg para o volume (mL) a administrar.

    Ex: dose 250 mg; concentração do frasco 125 mg / 5 mL
        -> 250 / (125 / 5) = 10 mL
    """
    dose_mg = Decimal(str(dose_mg))
    concentration_mg = Decimal(str(concentration_mg))
    concentration_ml = Decimal(str(concentration_ml))
    if dose_mg <= 0 or concentration_mg <= 0 or concentration_ml <= 0:
        raise ValueError(
            "Dosagem, concentração do frasco e volume do frasco"
            " devem ser maiores que zero."
        )
    concentration = concentration_mg / concentration_ml
    return (dose_mg / concentration).quantize(_CENT, rounding=ROUND_HALF_UP)
