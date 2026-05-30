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


def dose_to_drops(dose_mg, concentration_mg, concentration_ml, drops_per_ml) -> Decimal:
    """Converte uma dose em mg para o número de gotas a administrar.

    gotas = volume (mL) * gotas/mL. Ex: dipirona 500 mg/mL, 20 gotas/mL
        -> 1 gota = 25 mg; dose 100 mg = 0,2 mL = 4 gotas.
    Arredonda para a gota inteira mais próxima.
    """
    drops_per_ml = Decimal(str(drops_per_ml))
    if drops_per_ml <= 0:
        raise ValueError("Gotas por mL deve ser maior que zero.")
    volume_ml = dose_to_volume_ml(dose_mg, concentration_mg, concentration_ml)
    drops = volume_ml * drops_per_ml
    return drops.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def dose_to_presentation(dose_mg, presentation: dict) -> dict:
    """Converte uma dose (mg) para a apresentação escolhida.

    ``presentation`` segue o schema do catálogo
    (``concentration_mg``/``concentration_ml``/``form``/``drops_per_ml``).

    Returns:
        {
            "volume_ml": Decimal | None,  # None para formas sólidas
            "drops": Decimal | None,      # apenas para form == "gotas"
            "units": Decimal | None,      # nº de unidades (formas sólidas)
        }
    """
    concentration_mg = presentation.get("concentration_mg")
    concentration_ml = presentation.get("concentration_ml")

    # Formas sólidas (comprimido/supositório): nº de unidades = dose / mg por unidade.
    if concentration_ml is None:
        units = None
        if concentration_mg:
            units = (Decimal(str(dose_mg)) / Decimal(str(concentration_mg))).quantize(
                _CENT, rounding=ROUND_HALF_UP
            )
        return {"volume_ml": None, "drops": None, "units": units}

    volume_ml = dose_to_volume_ml(dose_mg, concentration_mg, concentration_ml)

    drops = None
    if presentation.get("form") == "gotas" and presentation.get("drops_per_ml"):
        drops = dose_to_drops(
            dose_mg,
            concentration_mg,
            concentration_ml,
            presentation["drops_per_ml"],
        )

    return {"volume_ml": volume_ml, "drops": drops, "units": None}
