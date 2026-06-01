import re
from decimal import Decimal

FREQUENCY_PATTERN = re.compile(r"(\d+)/(\d+)h")


def parse_frequency(freq_str: str) -> dict:
    """Parse frequency string to doses per day.

    Examples:
        '6/6h' -> {'interval_hours': 6, 'doses_per_day': Decimal('4')}
        '4/4h' -> {'interval_hours': 4, 'doses_per_day': Decimal('6')}
        'contínua' -> {'interval_hours': None, 'doses_per_day': Decimal('1')}
    """
    freq_str = freq_str.strip().lower()

    if "contínua" in freq_str or "contínuo" in freq_str:
        return {"interval_hours": None, "doses_per_day": Decimal("1")}

    match = FREQUENCY_PATTERN.match(freq_str)
    if match:
        interval = int(match.group(2))
        if interval <= 0:
            raise ValueError(f"Invalid interval in frequency: {freq_str}")
        return {
            "interval_hours": interval,
            "doses_per_day": Decimal("24") / Decimal(str(interval)),
        }

    # Try qXh pattern: q6h, q4h
    q_match = re.match(r"q(\d+)h?", freq_str)
    if q_match:
        interval = int(q_match.group(1))
        if interval <= 0:
            raise ValueError(f"Invalid interval in frequency: {freq_str}")
        return {
            "interval_hours": interval,
            "doses_per_day": Decimal("24") / Decimal(str(interval)),
        }

    raise ValueError(f"Cannot parse frequency: {freq_str}")


def frequency_from_hours(hours) -> dict:
    """Doses por dia a partir de um intervalo em horas (inteiro).

    Ponte para o catálogo de medicamentos, cujo ``frequency_hours`` é um
    inteiro (ex: a cada 6h -> 6), sem precisar montar a string de frequência.

    Ex: 6 -> {'interval_hours': 6, 'doses_per_day': Decimal('4')}
    """
    interval = Decimal(str(hours))
    if interval <= 0:
        raise ValueError("Tempo da prescrição deve ser maior que zero.")
    interval_hours = (
        int(interval) if interval == interval.to_integral_value() else interval
    )
    return {
        "interval_hours": interval_hours,
        "doses_per_day": Decimal("24") / interval,
    }
