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
