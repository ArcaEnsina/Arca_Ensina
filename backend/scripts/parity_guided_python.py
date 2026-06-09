#!/usr/bin/env python
"""Script de paridade para o GuidedProtocolInterpreter.

Carrega a fixture dengue_guiado, executa o interpretador Python através de um conjunto
de cenários determinísticos cobrindo todos os 9 tipos de passos, e escreve
o JSON normalizado com as chaves ordenadas para stdout (ou um arquivo temporário),
para que possa ser comparado com uma implementação JS/TS.

Uso:
    python backend/scripts/parity_guided_python.py
    python backend/scripts/parity_guided_python.py --output /tmp/parity.json
"""

import json
import os
import sys
from decimal import Decimal
from pathlib import Path

# Bootstrap Django so imports work when run standalone
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import django  # noqa: E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
django.setup()

from apps.protocols.engine.interpreter import GuidedProtocolInterpreter  # noqa: E402

FIXTURE_PATH = BACKEND_DIR / "apps" / "protocols" / "fixtures" / "dengue_guiado.json"

# Helpers

def decimal_default(obj):
    """JSON serialiser hook for Decimal."""
    if isinstance(obj, Decimal):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def normalise(obj):
    """Recursively sort dicts so JSON output is deterministic."""
    if isinstance(obj, dict):
        return {k: normalise(v) for k, v in sorted(obj.items())}
    if isinstance(obj, list):
        return [normalise(v) for v in obj]
    return obj


def run_scenario(name, steps_data, actions):
    """Run a sequence of (step_key, values) actions through the interpreter.

    Returns a dict with the scenario name, the sequence of resolved next
    steps, and the final computed step key.
    """
    interpreter = GuidedProtocolInterpreter(steps_data)
    trace = []
    current_step_key = interpreter.get_first_step_id()
    history = []

    for action in actions:
        step_key = action["step_key"]
        values = action.get("values", {})
        loop_count = action.get("loop_count", 0)

        # Verify we're on the expected step
        assert current_step_key == step_key, (
            f"[{name}] Expected step '{step_key}' but interpreter says "
            f"'{current_step_key}'"
        )

        # Build context from history
        context = interpreter.build_context(history, values)

        # Evaluate gates
        gate_warnings = interpreter.evaluate_step_gates(step_key, context)

        # Apply derived calculation if applicable
        step = interpreter.get_step(step_key)
        effective_values = dict(values)
        if step and step.get("type") == "derived_calc":
            effective_values = interpreter.apply_derived_calculation(
                step_key, effective_values, context
            )

        # Resolve next step
        next_step_key = interpreter.resolve_next_step_id(
            step_key,
            effective_values,
            {"loop_count": loop_count},
        )

        trace.append(
            {
                "step_key": step_key,
                "step_type": step.get("type") if step else None,
                "values": normalise(effective_values),
                "loop_count": loop_count,
                "gate_warnings": gate_warnings,
                "resolved_next": next_step_key,
            }
        )

        # Record in history
        history.append({"step_key": step_key, "values": effective_values})
        current_step_key = next_step_key

    return normalise(
        {
            "scenario": name,
            "trace": trace,
            "final_step_key": current_step_key,
        }
    )

# Scenarios

def scenario_a_group_c_full_path(steps_data):
    """Group C full path: info → checklist(0) → checklist(1+) → info →
    numeric_input → derived_calc → yes_no(False) → titration_loop →
    wait_reassess → yes_no(True) → derived_calc → info → end.

    Step types: info, checklist, numeric_input, derived_calc, yes_no,
    titration_loop, wait_reassess.
    """
    return run_scenario(
        "group_c_full_path",
        steps_data,
        [
            # step_0: info — ack
            {"step_key": "step_0", "values": {"ack": True}},
            # step_1_gravidade: checklist — no gravity signs checked
            {"step_key": "step_1_gravidade", "values": {"checked_items": []}},
            # step_1b_alerta: checklist — 2 alert signs
            {
                "step_key": "step_1b_alerta",
                "values": {"checked_items": ["a1", "a2"]},
            },
            # step_c_exames: info
            {"step_key": "step_c_exames", "values": {"ack": True}},
            # step_c_peso: numeric_input
            {"step_key": "step_c_peso", "values": {"peso_kg": 12}},
            # step_c_expansao: derived_calc
            {"step_key": "step_c_expansao", "values": {"peso_kg": "12"}},
            # step_c_avaliacao1: yes_no — False → repeticao
            {"step_key": "step_c_avaliacao1", "values": {"answer": False}},
            # step_c_repeticao: titration_loop — iteration 1, no congestion
            {
                "step_key": "step_c_repeticao",
                "values": {"congestion": False},
                "loop_count": 0,
            },
            # step_c_avaliacao_horaria: wait_reassess
            {
                "step_key": "step_c_avaliacao_horaria",
                "values": {"diurese": "adequada", "pressao_arterial": "estavel"},
            },
            # step_c_avaliacao2: yes_no — True → manutencao
            {"step_key": "step_c_avaliacao2", "values": {"answer": True}},
            # step_c_manutencao: derived_calc
            {"step_key": "step_c_manutencao", "values": {"peso_kg": "12"}},
            # step_fases_dengue: wait_reassess → end
            {
                "step_key": "step_fases_dengue",
                "values": {"monitorado": True},
            },
            # step_diagnostico_laboratorial: info → end (next_step=None)
            {
                "step_key": "step_diagnostico_laboratorial",
                "values": {"ack": True},
            },
        ],
    )


def scenario_b_group_d_full_path(steps_data):
    """Group D full path: info → checklist(1+) → info → numeric_input →
    derived_calc → yes_no(False) → yes_no(True) → medication_prescription →
    yes_no(True) → medication_prescription → yes_no(True) →
    medication_prescription → wait_reassess → info → end.

    Step types: info, checklist, numeric_input, derived_calc, yes_no,
    medication_prescription, wait_reassess.
    """
    return run_scenario(
        "group_d_full_path",
        steps_data,
        [
            # step_0: info
            {"step_key": "step_0", "values": {"ack": True}},
            # step_1_gravidade: checklist — 1 gravity sign → Group D
            {
                "step_key": "step_1_gravidade",
                "values": {"checked_items": ["g1"]},
            },
            # step_d_exames: info
            {"step_key": "step_d_exames", "values": {"ack": True}},
            # step_d_peso: numeric_input
            {"step_key": "step_d_peso", "values": {"peso_kg": 10}},
            # step_d_expansao: derived_calc
            {"step_key": "step_d_expansao", "values": {"peso_kg": "10"}},
            # step_d_avaliacao1: yes_no — False → hct_direcao
            {"step_key": "step_d_avaliacao1", "values": {"answer": False}},
            # step_d_hct_direcao: yes_no — True → albumina
            {"step_key": "step_d_hct_direcao", "values": {"answer": True}},
            # step_d_albumina: medication_prescription
            {"step_key": "step_d_albumina", "values": {"accepted": True}},
            # step_d_persiste_choque: yes_no — True → DVA
            {"step_key": "step_d_persiste_choque", "values": {"answer": True}},
            # step_d_dva: medication_prescription
            {"step_key": "step_d_dva", "values": {"accepted": True}},
            # step_d_hiperhidratacao_check: yes_no — True → hiperhidratacao
            {
                "step_key": "step_d_hiperhidratacao_check",
                "values": {"answer": True},
            },
            # step_d_hiperhidratacao: medication_prescription
            {"step_key": "step_d_hiperhidratacao", "values": {"accepted": True}},
            # step_fases_dengue: wait_reassess
            {
                "step_key": "step_fases_dengue",
                "values": {"monitorado": True},
            },
            # step_diagnostico_laboratorial: info → end
            {
                "step_key": "step_diagnostico_laboratorial",
                "values": {"ack": True},
            },
        ],
    )


def scenario_c_synthetic_multiple_choice():
    """Synthetic fixture exercising multiple_choice step type."""
    steps_data = {
        "steps": [
            {
                "id": "start",
                "type": "info",
                "title": "Start",
                "next_step": "classify",
            },
            {
                "id": "classify",
                "type": "multiple_choice",
                "title": "Classify",
                "choices_next": {
                    "grave": "treat_grave",
                    "moderado": "treat_moderado",
                    "leve": "treat_leve",
                },
            },
            {
                "id": "treat_grave",
                "type": "medication_prescription",
                "title": "Treatment Grave",
                "medications": [{"name": "Med A", "dose": "10mg/kg", "route": "IV"}],
                "next_step": "end",
            },
            {
                "id": "treat_moderado",
                "type": "info",
                "title": "Treatment Moderado",
                "next_step": "end",
            },
            {
                "id": "treat_leve",
                "type": "info",
                "title": "Treatment Leve",
                "next_step": "end",
            },
            {
                "id": "end",
                "type": "info",
                "title": "End",
                "next_step": None,
            },
        ]
    }

    return run_scenario(
        "synthetic_multiple_choice",
        steps_data,
        [
            {"step_key": "start", "values": {"ack": True}},
            {"step_key": "classify", "values": {"choice": "grave"}},
            {"step_key": "treat_grave", "values": {"accepted": True}},
            {"step_key": "end", "values": {"ack": True}},
        ],
    )


def scenario_d_outside_protocol(steps_data):
    """Path that exits protocol scope (Groups A/B — no alert, no gravity)."""
    return run_scenario(
        "outside_protocol_scope",
        steps_data,
        [
            {"step_key": "step_0", "values": {"ack": True}},
            # No gravity signs
            {
                "step_key": "step_1_gravidade",
                "values": {"checked_items": []},
            },
            # No alert signs → outside protocol
            {
                "step_key": "step_1b_alerta",
                "values": {"checked_items": []},
            },
            # step_fora_protocolo: info → end (next_step=None)
            {"step_key": "step_fora_protocolo", "values": {"ack": True}},
        ],
    )


def scenario_e_group_d_no_shock(steps_data):
    """Group D path with improvement and no persistent shock."""
    return run_scenario(
        "group_d_no_shock",
        steps_data,
        [
            {"step_key": "step_0", "values": {"ack": True}},
            {
                "step_key": "step_1_gravidade",
                "values": {"checked_items": ["g3"]},
            },
            {"step_key": "step_d_exames", "values": {"ack": True}},
            {"step_key": "step_d_peso", "values": {"peso_kg": 20}},
            {"step_key": "step_d_expansao", "values": {"peso_kg": "20"}},
            # True → para_c (conduzir como grupo C)
            {"step_key": "step_d_avaliacao1", "values": {"answer": True}},
            # step_c_manutencao: derived_calc
            {"step_key": "step_c_manutencao", "values": {"peso_kg": "20"}},
            # step_fases_dengue: wait_reassess
            {"step_key": "step_fases_dengue", "values": {"monitorado": True}},
            # step_diagnostico_laboratorial: info → end
            {
                "step_key": "step_diagnostico_laboratorial",
                "values": {"ack": True},
            },
        ],
    )


def scenario_f_titration_max_reached(steps_data):
    """Titration loop hitting max iterations."""
    return run_scenario(
        "titration_max_reached",
        steps_data,
        [
            {"step_key": "step_0", "values": {"ack": True}},
            {
                "step_key": "step_1_gravidade",
                "values": {"checked_items": []},
            },
            {
                "step_key": "step_1b_alerta",
                "values": {"checked_items": ["a1"]},
            },
            {"step_key": "step_c_exames", "values": {"ack": True}},
            {"step_key": "step_c_peso", "values": {"peso_kg": 15}},
            {"step_key": "step_c_expansao", "values": {"peso_kg": "15"}},
            # No → repeticao
            {"step_key": "step_c_avaliacao1", "values": {"answer": False}},
            # Loop iteration 1 — no congestion
            {
                "step_key": "step_c_repeticao",
                "values": {"congestion": False},
                "loop_count": 0,
            },
            # Loop iteration 2 — no congestion
            {
                "step_key": "step_c_repeticao",
                "values": {"congestion": False},
                "loop_count": 1,
            },
            # Loop iteration 3 — at max (max_iterations=3), no congestion
            {
                "step_key": "step_c_repeticao",
                "values": {"congestion": False},
                "loop_count": 2,
            },
            # After max → step_c_avaliacao_horaria
            {
                "step_key": "step_c_avaliacao_horaria",
                "values": {"diurese": "adequada"},
            },
            # step_c_avaliacao2: True → manutencao
            {"step_key": "step_c_avaliacao2", "values": {"answer": True}},
            {"step_key": "step_c_manutencao", "values": {"peso_kg": "15"}},
            {"step_key": "step_fases_dengue", "values": {"monitorado": True}},
            {
                "step_key": "step_diagnostico_laboratorial",
                "values": {"ack": True},
            },
        ],
    )


def scenario_g_titration_congestion(steps_data):
    """Titration loop with congestion detected early."""
    return run_scenario(
        "titration_congestion",
        steps_data,
        [
            {"step_key": "step_0", "values": {"ack": True}},
            {
                "step_key": "step_1_gravidade",
                "values": {"checked_items": []},
            },
            {
                "step_key": "step_1b_alerta",
                "values": {"checked_items": ["a1"]},
            },
            {"step_key": "step_c_exames", "values": {"ack": True}},
            {"step_key": "step_c_peso", "values": {"peso_kg": 10}},
            {"step_key": "step_c_expansao", "values": {"peso_kg": "10"}},
            {"step_key": "step_c_avaliacao1", "values": {"answer": False}},
            # Loop iteration 1 — congestion detected
            {
                "step_key": "step_c_repeticao",
                "values": {"congestion": True},
                "loop_count": 0,
            },
            # → step_c_avaliacao_horaria
            {
                "step_key": "step_c_avaliacao_horaria",
                "values": {"diurese": "baixa"},
            },
            # step_c_avaliacao2: False → conduzir_d
            {"step_key": "step_c_avaliacao2", "values": {"answer": False}},
            # step_c_conduzir_d: info → step_d_persiste_choque
            {"step_key": "step_c_conduzir_d", "values": {"ack": True}},
            # step_d_persiste_choque: False → hiperhidratacao_check
            {"step_key": "step_d_persiste_choque", "values": {"answer": False}},
            # step_d_hiperhidratacao_check: False → fases_dengue
            {
                "step_key": "step_d_hiperhidratacao_check",
                "values": {"answer": False},
            },
            {"step_key": "step_fases_dengue", "values": {"monitorado": True}},
            {
                "step_key": "step_diagnostico_laboratorial",
                "values": {"ack": True},
            },
        ],
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Run parity scenarios against the Python GuidedProtocolInterpreter."
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Write JSON to this file instead of stdout.",
    )
    args = parser.parse_args()

    # Load dengue fixture
    with open(FIXTURE_PATH) as f:
        fixture = json.load(f)

    steps_data = fixture[1]["fields"]["steps_data"]

    results = []

    # Scenario A: Group C full path
    results.append(scenario_a_group_c_full_path(steps_data))

    # Scenario B: Group D full path
    results.append(scenario_b_group_d_full_path(steps_data))

    # Scenario C: Synthetic multiple_choice
    results.append(scenario_c_synthetic_multiple_choice())

    # Scenario D: Outside protocol scope
    results.append(scenario_d_outside_protocol(steps_data))

    # Scenario E: Group D → improves → Group C
    results.append(scenario_e_group_d_no_shock(steps_data))

    # Scenario F: Titration max reached
    results.append(scenario_f_titration_max_reached(steps_data))

    # Scenario G: Titration congestion
    results.append(scenario_g_titration_congestion(steps_data))

    output = normalise(
        {
            "engine": "python",
            "engine_version": "1.0.0",
            "fixture": str(FIXTURE_PATH.name),
            "scenarios": results,
        }
    )

    json_str = json.dumps(output, indent=2, ensure_ascii=False, default=decimal_default)

    if args.output:
        out_path = Path(args.output)
        out_path.write_text(json_str, encoding="utf-8")
        print(f"Written to {out_path}", file=sys.stderr)
    else:
        print(json_str)


if __name__ == "__main__":
    main()
