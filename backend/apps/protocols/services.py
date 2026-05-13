from django.utils import timezone
from .models import ProtocolExecutionState

class ProtocolExecutionEngine:
    def primeiro_step(self, version):
        return version.steps.order_by("order").first()

    def comecar(self,exec):
        primeiro_step = self.primeiro_step(exec.version)
        exec.current_step = primeiro_step
        exec.save(update_fields=["current_step"])
        return exec

    def resposta_step_atual(self, exec, valores):
        state, created = ProtocolExecutionState.objects.update_or_create(
            execution=exec,
            step=exec.current_step,
            defaults={"values": valores},
        )

        next_step= exec.current_step.next_step
        if next_step is None:
            exec.current_step = None
            exec.status= exec.Status.CONCLUIDO
            exec.finished_at = timezone.now()
            exec.save(update_fields=["current_step", "status", "finished_at"])
        else:
            exec.current_step=next_step
            exec.save(update_fields=["current_step"])
        

        return state

    def calcular_formula(self, formula, contexto):
        pass