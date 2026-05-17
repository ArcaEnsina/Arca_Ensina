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

        return step.get("next_step")
