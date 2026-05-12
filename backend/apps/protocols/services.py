class ProtocolExecutionEngine:
    def primeiro_step(self, version):
        return version.steps.order_by("order").first()

    def comecar(self,exec):
        primeiro_step = self.primeiro_step(exec.version)
        exec.current_step = primeiro_step
        exec.save(update_fields=["current_step"])
        return exec

    def resposta_step_atual(self, exec, valores):
        pass

    def calcular_formula(self, formula, contexto):
        pass