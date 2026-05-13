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

        next_step= self.escolher_prox_step(exec.current_step, valores)
        
        if next_step is None:
            exec.current_step = None
            exec.status= exec.Status.CONCLUIDO
            exec.finished_at = timezone.now()
            exec.save(update_fields=["current_step", "status", "finished_at"])
        else:
            exec.current_step=next_step
            exec.save(update_fields=["current_step"])
        

        return state
    
    def escolher_prox_step(self, step, valores):
        if step.step_type == step.StepType.SIM_NAO:
            resposta=valores.get("answer")

            if resposta is True:
                next_id = step.config.get("true_next_step_id")

            else:
                next_id = step.config.get("false_next_step_id")
            
            if next_id:
                return step.version.steps.filter(id=next_id).first() 

        return step.next_step

    def calcular_formula(self, formula, contexto):
    #ta mofando tem tempo a calculadora malskk
        pass