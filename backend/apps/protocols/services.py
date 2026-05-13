import ast
import operator

from django.utils import timezone

from .models import ProtocolExecutionState


class ProtocolExecutionEngine:
    def primeiro_step(self, version):
        return version.steps.order_by("order").first()

    def comecar(self, execution):
        primeiro_step = self.primeiro_step(execution.version)
        execution.current_step = primeiro_step
        execution.save(update_fields=["current_step"])
        return execution

    def resposta_step_atual(self, execution, valores):
        step = execution.current_step

        if step.step_type == step.StepType.CALCULO_DERIVADO:
            formula = step.config.get("formula")
            output_field = step.config.get("output_field", "result")
            
            if formula:
                valores = {
                    **valores,
                    output_field: self.calcular_formula(formula,valores),
                }

        state, created = ProtocolExecutionState.objects.update_or_create(
            execution=execution,
            step=step,
            defaults={"values": valores},
        )

        next_step = self.escolher_prox_step(step, valores, state)

        if next_step is None:
            execution.current_step = None
            execution.status = execution.Status.CONCLUIDO
            execution.finished_at = timezone.now()
            execution.save(update_fields=["current_step", "status", "finished_at"])
        else:
            execution.current_step = next_step
            execution.save(update_fields=["current_step"])

        return state

    def escolher_prox_step(self, step, valores, state=None):
        if step.step_type == step.StepType.SIM_NAO:
            resposta = valores.get("answer")

            if resposta is True:
                next_id = step.config.get("true_next_step_id")
            else:
                next_id = step.config.get("false_next_step_id")

            if next_id:
                return step.version.steps.filter(id=next_id).first()

        if step.step_type == step.StepType.CHECKLIST:
            checked_items = valores.get("checked_items", [])
            min_checked = step.config.get("min_checked", 1)

            if len(checked_items) >= min_checked:
                next_id = step.config.get("true_next_step_id")
            else:
                next_id = step.config.get("false_next_step_id")

            if next_id:
                return step.version.steps.filter(id=next_id).first()

        if step.step_type == step.StepType.LOOP_TITULACAO:
            iteracoes = step.config.get("max_iterations", 1)
            loops = (state.loop_count if state else 0) + 1

            if state:
                state.loop_count = loops
                state.save(update_fields=["loop_count"])

            if loops >= iteracoes:
                next_id = step.config.get("max_reached_next_step_id")
            else:
                next_id = step.config.get("loop_next_step_id")

            if next_id:
                return step.version.steps.filter(id=next_id).first()


        return step.next_step

    def calcular_formula(self, formula, contexto):
        #agora VAI
        operadores={
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Pow: operator.pow,
            ast.USub: operator.neg,
        }
    
        def avaliar(node):
            if isinstance(node, ast.Constant):
                if isinstance(node.value, (int, float)):
                    return node.value
                raise ValueError("A fórmulaa só aceita números!")

            if isinstance(node, ast.Name):
                if node.id not in contexto:
                    raise ValueError(f"Variável Desconhecida: {node.id}")
                return contexto[node.id]
            
            if isinstance(node, ast.BinOp):
                operador = operadores.get(type(node.op))
                if operador is None:
                    raise ValueError("Operador inválido")
                
                esquerda = avaliar(node.left)
                direita = avaliar(node.right)
                return operador(esquerda, direita)
            
            if isinstance(node, ast.UnaryOp):
                operador = operadores.get(type(node.op))
                if operador is None:
                    raise ValueError("Operador Inválido")

                valor = avaliar(node.operand)
                return operador(valor)    
            
            raise ValueError("Expressão Inválida: Use apenas números, variáveis e operações.")
            
    
        tree = ast.parse(formula, mode="eval")
        return avaliar(tree.body)