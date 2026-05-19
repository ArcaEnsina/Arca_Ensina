import ast
import operator
from decimal import Decimal


class GuidedProtocolInterpreter:
    """Interpreta protocolos guiados diretamente do steps_data JSON."""

    def __init__(self, steps_data):
        self.steps_data = steps_data or {}
        self.ordered_steps = self.steps_data.get("steps", [])
        self.steps_by_id = {
            step["id"]: step
            for step in self.ordered_steps
            if step.get("id")
        }

    def get_step(self, step_id):
        return self.steps_by_id.get(step_id)

    def get_first_step_id(self):
        if not self.ordered_steps:
            return None
        return self.ordered_steps[0].get("id")

    def resolve_next_step_id(self, current_step_id, values, state=None):
        step = self.get_step(current_step_id)
        if not step:
            return None

        step_type = step.get("type")

        if step_type == "yes_no":
            if values.get("answer") is True:
                return step.get("true_next") or step.get("rule", {}).get("true_next")
            return step.get("false_next") or step.get("rule", {}).get("false_next")

        if step_type == "checklist":
            rule = step.get("rule", {})
            checked_items = values.get("checked_items", [])
            min_checked = rule.get("min_checked", 1)

            if len(checked_items) >= min_checked:
                return rule.get("true_next")
            return rule.get("false_next")

        if step_type == "titration_loop":
            state = state or {}
            loop_count = state.get("loop_count", 0) + 1
            max_iterations = step.get("max_iterations", 1)

            congestion_check = step.get("congestion_check", {})
            if values.get("congestion") is True:
                return congestion_check.get("true_next")

            if loop_count >= max_iterations:
                return step.get("max_reached_next")

            return congestion_check.get("false_next") or step.get("loop_next")

        if step_type == "multiple_choice":
            choice = values.get("choice")
            choices_next = step.get("choices_next", {})
            return choices_next.get(choice) or step.get("next_step")

        return step.get("next_step")

    def evaluate_formula(self, formula, context):
        operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Pow: operator.pow,
            ast.USub: operator.neg,
        }

        def evaluate(node):
            if isinstance(node, ast.Constant):
                if isinstance(node.value, (int, float)):
                    return Decimal(str(node.value))
                raise ValueError("A formula so aceita numeros.")

            if isinstance(node, ast.Name):
                if node.id not in context:
                    raise ValueError(f"Variavel desconhecida na formula: {node.id}")
                return Decimal(str(context[node.id]))

            if isinstance(node, ast.BinOp):
                op = operators.get(type(node.op))
                if op is None:
                    raise ValueError("Operador nao permitido na formula.")
                return op(evaluate(node.left), evaluate(node.right))

            if isinstance(node, ast.UnaryOp):
                op = operators.get(type(node.op))
                if op is None:
                    raise ValueError("Operador nao permitido na formula.")
                return op(evaluate(node.operand))

            raise ValueError("Expressao nao permitida na formula.")

        tree = ast.parse(formula, mode="eval")
        return evaluate(tree.body)

    def apply_derived_calculation(self, step_id, values, context=None):
        step = self.get_step(step_id)
        if not step or step.get("type") != "derived_calc":
            return values

        formula = step.get("formula")
        if not formula:
            return values

        calculation_context = {
            **(context or {}),
            **values,
        }
        output_field = step.get("output_field") or step.get("output_label") or "result"
        result = self.evaluate_formula(formula, calculation_context)

        return {
            **values,
            output_field: str(result),
        }

    def build_context(self, history=None, current_values=None):
        context = {}

        for state in history or []:
            context.update(state.get("values", {}))

        if current_values:
            context.update(current_values)

        return context

    def evaluate_gate(self, gate, context):
        """Avalia um único gate expression contra o contexto.

        Retorna um dicionário com os resultados da avaliação do gate.
        """
        expression = gate.get("expression", "")
        level = gate.get("level", "warning")
        message = gate.get("message") or gate.get("failure_message", "")

        if not expression:
            return None

        try:
            result = self._evaluate_boolean_expression(expression, context)
            if result:
                return None  # Passou
            return {
                "passed": False,
                "level": level,
                "message": message,
                "expression": expression,
            }
        except Exception:
            # Se falha, tratado como warning
            return {
                "passed": False,
                "level": "warning",
                "message": f"Nao foi possivel avaliar gate: {message}",
                "expression": expression,
            }

    def evaluate_step_gates(self, step_id, context):
        """Avalia todos os gates de um step e
        retorna uma lista de warnings de gate falhados."""
        step = self.get_step(step_id)
        if not step:
            return []

        gate = step.get("gate")
        if not gate:
            return []

        # Suporta gate único ou lista de gates
        gates = gate if isinstance(gate, list) else [gate]
        warnings = []

        for g in gates:
            result = self.evaluate_gate(g, context)
            if result:
                warnings.append(result)

        return warnings

    def evaluate_entry_gates(self, context):
        """Avalia os gates de entrada no root do protocolo e
        retorna uma lista de warnings de gate falhados."""
        entry_gates = self.steps_data.get("entry_gates", [])
        warnings = []

        for gate in entry_gates:
            result = self.evaluate_gate(gate, context)
            if result:
                warnings.append(result)

        return warnings

    def _evaluate_boolean_expression(self, expression, context):
        """Safely evaluate a boolean expression string against a context dict.

        Supports: ==, !=, <, >, <=, >=, and, or, not, in, context.var
        """
        allowed_nodes = (
            ast.Expression, ast.BoolOp, ast.Compare, ast.Name, ast.Constant,
            ast.UnaryOp,
            ast.And, ast.Or, ast.Not, ast.In, ast.NotIn,
            ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
            ast.Is, ast.IsNot, ast.Load,
        )

        tree = ast.parse(expression, mode='eval')

        for node in ast.walk(tree):
            if not isinstance(node, allowed_nodes):
                raise ValueError(f"Operacao nao permitida: {type(node).__name__}")

        def eval_node(node):
            if isinstance(node, ast.Constant):
                return node.value
            if isinstance(node, ast.Name):
                if node.id == "True":
                    return True
                if node.id == "False":
                    return False
                if node.id.startswith("context."):
                    key = node.id.split(".", 1)[1]
                    return context.get(key)
                return context.get(node.id)
            if isinstance(node, ast.BoolOp):
                values = [eval_node(v) for v in node.values]
                if isinstance(node.op, ast.And):
                    return all(values)
                if isinstance(node.op, ast.Or):
                    return any(values)
            if isinstance(node, ast.Compare):
                left = eval_node(node.left)
                for op, comparator in zip(node.ops, node.comparators):
                    right = eval_node(comparator)
                    if isinstance(op, ast.Eq):
                        result = left == right
                    elif isinstance(op, ast.NotEq):
                        result = left != right
                    elif isinstance(op, ast.Lt):
                        result = left < right
                    elif isinstance(op, ast.LtE):
                        result = left <= right
                    elif isinstance(op, ast.Gt):
                        result = left > right
                    elif isinstance(op, ast.GtE):
                        result = left >= right
                    elif isinstance(op, ast.In):
                        result = left in right
                    elif isinstance(op, ast.NotIn):
                        result = left not in right
                    else:
                        raise ValueError("Operador de comparacao nao suportado")
                    if not result:
                        return False
                    left = right
                return True
            if isinstance(node, ast.UnaryOp):
                if isinstance(node.op, ast.Not):
                    return not eval_node(node.operand)
                raise ValueError("Operador unario nao suportado")
            raise ValueError(f"No nao suportado: {type(node).__name__}")

        return eval_node(tree.body)
