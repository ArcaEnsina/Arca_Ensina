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
        state, created = ProtocolExecutionState.objects.update_or_create(
            execution=execution,
            step=execution.current_step,
            defaults={"values": valores},
        )

        next_step = self.escolher_prox_step(execution.current_step, valores, state)

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
        # SCRUM-31: implementar engine segura de fórmulas inline.
        pass
