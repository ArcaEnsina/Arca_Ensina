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
