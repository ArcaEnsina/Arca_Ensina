from decimal import Decimal

from apps.pharma_engine.formula import SafeFormulaEvaluator
from apps.pharma_engine.pipeline import calculate_dose_pipeline


class SedationConverter:
    """Converte doses entre fármacos com base nos dados do painel."""

    def __init__(self, panel_data):
        self.panel_data = panel_data or {}
        self.sections = self.panel_data.get("sections", [])
        self.evaluator = SafeFormulaEvaluator()

    def calculate(self, origem, destino, dose, peso_kg, horario=None):
        """Calcula conversão de dose entre fármacos."""
        row = self._find_row(origem, destino)
        if not row:
            raise ValueError(f"Par de fármacos não encontrado: {origem} → {destino}.")

        formula = row["formula"]
        context = {"dose": dose, "peso_kg": peso_kg}

        try:
            converted_dose = self.evaluator.evaluate(formula, context)
        except (ZeroDivisionError, Exception) as exc:
            raise ValueError(
                "Divisão por zero ou operação decimal inválida na fórmula."
            ) from exc

        if converted_dose < 0:
            raise ValueError(
                "Resultado da fórmula é negativo: "
                "dose convertida não pode ser negativa."
            )

        limit_dict = self._find_limit(destino)

        result = calculate_dose_pipeline(
            formula_result=converted_dose,
            output_unit_str=row.get("output_unit", "mg/24h"),
            frequency_str=row.get("frequency", ""),
            weight_kg=Decimal(str(peso_kg)),
            limit_dict=limit_dict,
            formula_applied=formula,
        )

        return result

    def _find_row(self, origem, destino):
        """Busca row por match exato de drug_a e drug_b em todas as sections."""
        for section in self.sections:
            for row in section.get("rows", []):
                if row.get("drug_a") == origem and row.get("drug_b") == destino:
                    return row
        return None

    def _find_limit(self, destino):
        """Busca dose_limit: match exato primeiro, fallback substring."""
        destino_lower = destino.lower()
        for section in self.sections:
            for limit in section.get("dose_limits", []):
                drug = limit.get("drug", "").lower()
                if drug == destino_lower:
                    return limit
        # Fallback: substring match
        for section in self.sections:
            for limit in section.get("dose_limits", []):
                drug = limit.get("drug", "").lower()
                if drug in destino_lower or destino_lower in drug:
                    return limit
        return None
