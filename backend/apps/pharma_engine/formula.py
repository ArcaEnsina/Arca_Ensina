import ast
import operator
import re
from decimal import Decimal


class SafeFormulaEvaluator:
    """Evaluates mathematical formulas safely using AST."""

    ALLOWED_OPERATORS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.USub: operator.neg,
    }

    def evaluate(self, formula: str, context: dict) -> Decimal:
        sanitized = re.sub(r"[^0-9+\-*/()._a-zA-Z\s]", "", formula)
        tree = ast.parse(sanitized, mode="eval")
        return self._eval_node(tree.body, context)

    def _eval_node(self, node, context):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return Decimal(str(node.value))
            raise ValueError("Formula only accepts numbers.")

        if isinstance(node, ast.Name):
            if node.id not in context:
                raise ValueError(f"Unknown variable: {node.id}")
            val = context[node.id]
            return Decimal(str(val))

        if isinstance(node, ast.BinOp):
            op = self.ALLOWED_OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError("Operator not allowed.")
            return op(
                self._eval_node(node.left, context),
                self._eval_node(node.right, context),
            )

        if isinstance(node, ast.UnaryOp):
            op = self.ALLOWED_OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError("Unary operator not allowed.")
            return op(self._eval_node(node.operand, context))

        raise ValueError("Expression not allowed.")
