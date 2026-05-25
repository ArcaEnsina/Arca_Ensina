import ast
import operator
import re
from decimal import Decimal, InvalidOperation


class SedationConverter:
    """Converte doses entre fármacos com base nos dados do painel."""

    def __init__(self, panel_data):
        self.panel_data = panel_data or {}
        self.sections = self.panel_data.get("sections", [])

    def calculate(self, origem, destino, dose, peso_kg, horario=None):
        """Calcula conversão de dose entre fármacos.

        Retorna dict com converted_dose, frequency, route, formula_applied,
        warnings.
        """
        row = self._find_row(origem, destino)
        if not row:
            raise ValueError(f"Par de fármacos não encontrado: {origem} → {destino}.")

        formula = row["formula"]
        context = {"dose": dose, "peso_kg": peso_kg}
        try:
            converted_dose = self._evaluate_formula(formula, context)
        except (ZeroDivisionError, InvalidOperation) as exc:
            raise ValueError(
                "Divisão por zero ou operação decimal inválida na fórmula."
            ) from exc

        if converted_dose < 0:
            raise ValueError(
                "Resultado da fórmula é negativo: "
                "dose convertida não pode ser negativa."
            )

        warnings = []
        limit = self._find_limit(destino)
        if limit:
            max_val = self._parse_number(limit["max_dose"])
            if max_val > 0:
                max_allowed = self._compute_max(limit, peso_kg)
                if converted_dose > max_allowed:
                    warnings.append(
                        {
                            "type": "above_max_recommended",
                            "drug": destino,
                            "current_dose": str(converted_dose),
                            "max_allowed": str(max_allowed),
                            "unit": limit["unit"],
                            "message": (
                                f"Dose convertida ({converted_dose} {limit['unit']})"
                                f" excede o máximo recomendado"
                                f" ({max_allowed} {limit['unit']})."
                            ),
                        }
                    )

        return {
            "converted_dose": str(converted_dose),
            "frequency": row.get("frequency", ""),
            "route": row.get("route", ""),
            "formula_applied": formula,
            "warnings": warnings,
        }

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

    def _compute_max(self, limit, peso_kg):
        """Calcula dose máxima permitida. Se per_kg, multiplica pelo peso."""
        max_val = self._parse_number(limit["max_dose"])
        if limit.get("type") == "per_kg":
            return max_val * peso_kg
        return max_val

    def _parse_number(self, value):
        """Extrai valor numérico inicial de uma string."""
        if isinstance(value, (int, Decimal)):
            return Decimal(str(value))
        if isinstance(value, float):
            return Decimal(str(value))
        match = re.match(r"[\d.]+", str(value))
        if not match:
            raise ValueError(f"Valor numérico inválido: {value}")
        try:
            return Decimal(match.group())
        except InvalidOperation as exc:
            raise ValueError(f"Valor numérico inválido: {value}") from exc

    def _evaluate_formula(self, formula, context):
        """Avalia fórmula de forma segura usando AST.

        Whitelist: Add, Sub, Mult, Div, USub.
        Variáveis permitidas: dose, peso_kg.
        """
        sanitized = re.sub(r"[^0-9+\-*/()._a-zA-Z\s]", "", formula)

        allowed_operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.USub: operator.neg,
        }

        def evaluate(node):
            if isinstance(node, ast.Constant):
                if isinstance(node.value, (int, float)):
                    return Decimal(str(node.value))
                raise ValueError("Fórmula só aceita números.")

            if isinstance(node, ast.Name):
                if node.id not in context:
                    raise ValueError(f"Variável desconhecida na fórmula: {node.id}")
                return Decimal(str(context[node.id]))

            if isinstance(node, ast.BinOp):
                op = allowed_operators.get(type(node.op))
                if op is None:
                    raise ValueError("Operador não permitido na fórmula.")
                left = evaluate(node.left)
                right = evaluate(node.right)
                return op(left, right)

            if isinstance(node, ast.UnaryOp):
                op = allowed_operators.get(type(node.op))
                if op is None:
                    raise ValueError("Operador unário não permitido na fórmula.")
                return op(evaluate(node.operand))

            raise ValueError("Expressão não permitida na fórmula.")

        tree = ast.parse(sanitized, mode="eval")
        return evaluate(tree.body)
