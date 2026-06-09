/**
 * Parity script for the JS GuidedProtocolInterpreter.
 *
 * Loads the dengue_guiado fixture, runs the JS interpreter through the same
 * deterministic test scenarios as backend/scripts/parity_guided_python.py,
 * and writes normalised JSON output to parity-output/guided.js.json.
 *
 * Step types exercised:
 *   1. info                   — Scenario A step_0, step_c_exames
 *   2. yes_no                 — Scenario A step_c_avaliacao1, Scenario B step_d_avaliacao1
 *   3. multiple_choice        — Scenario C (synthetic fixture)
 *   4. checklist              — Scenario A step_1_gravidade, step_1b_alerta
 *   5. numeric_input          — Scenario A step_c_peso
 *   6. derived_calc           — Scenario A step_c_expansao
 *   7. medication_prescription — Scenario B step_d_albumina
 *   8. wait_reassess          — Scenario A step_c_avaliacao_horaria
 *   9. titration_loop         — Scenario A step_c_repeticao
 *
 * Usage:
 *   npx tsx frontend/scripts/parity_guided_js.ts
 *   npx tsx frontend/scripts/parity_guided_js.ts --output parity-output/guided.js.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Dynamic import of the engine — works in Node with tsx
import { GuidedProtocolInterpreter } from '../src/engines/protocol/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_PATH = resolve(
  __dirname,
  '../../backend/apps/protocols/fixtures/dengue_guiado.json',
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalise(obj: unknown): unknown {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = normalise((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalise);
  }
  return obj;
}

interface Action {
  step_key: string;
  values: Record<string, unknown>;
  loop_count?: number;
}

interface TraceEntry {
  step_key: string;
  step_type: string | undefined;
  values: Record<string, unknown>;
  loop_count: number;
  gate_warnings: unknown[];
  resolved_next: string | null;
}

interface ScenarioResult {
  scenario: string;
  trace: TraceEntry[];
  final_step_key: string | null;
}

function runScenario(
  name: string,
  stepsData: Record<string, unknown>,
  actions: Action[],
): ScenarioResult {
  const interpreter = new GuidedProtocolInterpreter(stepsData);
  const trace: TraceEntry[] = [];
  let currentStepKey = interpreter.getFirstStepId() ?? null;
  const history: Array<{ stepKey: string; values: Record<string, unknown> }> = [];

  for (const action of actions) {
    const stepKey = action.step_key;
    const values = action.values ?? {};
    const loopCount = action.loop_count ?? 0;

    // Verify we're on the expected step
    if (currentStepKey !== stepKey) {
      throw new Error(
        `[${name}] Expected step '${stepKey}' but interpreter says '${currentStepKey}'`,
      );
    }

    // Build context from history
    const context = interpreter.buildContext(
      history.map((h) => ({ stepKey: h.stepKey, stepType: '', title: '', values: h.values, answeredAt: '' })),
      values,
    );

    // Evaluate gates
    const gateWarnings = interpreter.evaluateStepGates(stepKey, context);

    // Apply derived calculation if applicable
    const step = interpreter.getStep(stepKey);
    let effectiveValues = { ...values };
    if (step && step.type === 'derived_calc') {
      effectiveValues = interpreter.applyDerivedCalculation(
        stepKey,
        effectiveValues,
        context,
      );
    }

    // Resolve next step
    const { nextStepId } = interpreter.resolveNextStepId(
      stepKey,
      effectiveValues,
      { loopCount },
    );

    trace.push({
      step_key: stepKey,
      step_type: step?.type,
      values: effectiveValues as Record<string, unknown>,
      loop_count: loopCount,
      gate_warnings: gateWarnings,
      resolved_next: nextStepId,
    });

    // Record in history
    history.push({ stepKey, values: effectiveValues });
    currentStepKey = nextStepId;
  }

  return {
    scenario: name,
    trace,
    final_step_key: currentStepKey,
  };
}

// ---------------------------------------------------------------------------
// Scenarios (mirror Python parity_guided_python.py exactly)
// ---------------------------------------------------------------------------

function scenarioAGroupCFullPath(stepsData: Record<string, unknown>): ScenarioResult {
  return runScenario(
    'group_c_full_path',
    stepsData,
    [
      { step_key: 'step_0', values: { ack: true } },
      { step_key: 'step_1_gravidade', values: { checked_items: [] } },
      { step_key: 'step_1b_alerta', values: { checked_items: ['a1', 'a2'] } },
      { step_key: 'step_c_exames', values: { ack: true } },
      { step_key: 'step_c_peso', values: { peso_kg: 12 } },
      { step_key: 'step_c_expansao', values: { peso_kg: '12' } },
      { step_key: 'step_c_avaliacao1', values: { answer: false } },
      { step_key: 'step_c_repeticao', values: { congestion: false }, loop_count: 0 },
      {
        step_key: 'step_c_avaliacao_horaria',
        values: { diurese: 'adequada', pressao_arterial: 'estavel' },
      },
      { step_key: 'step_c_avaliacao2', values: { answer: true } },
      { step_key: 'step_c_manutencao', values: { peso_kg: '12' } },
      { step_key: 'step_fases_dengue', values: { monitorado: true } },
      { step_key: 'step_diagnostico_laboratorial', values: { ack: true } },
    ],
  );
}

function scenarioBGroupDFullPath(stepsData: Record<string, unknown>): ScenarioResult {
  return runScenario(
    'group_d_full_path',
    stepsData,
    [
      { step_key: 'step_0', values: { ack: true } },
      { step_key: 'step_1_gravidade', values: { checked_items: ['g1'] } },
      { step_key: 'step_d_exames', values: { ack: true } },
      { step_key: 'step_d_peso', values: { peso_kg: 10 } },
      { step_key: 'step_d_expansao', values: { peso_kg: '10' } },
      { step_key: 'step_d_avaliacao1', values: { answer: false } },
      { step_key: 'step_d_hct_direcao', values: { answer: true } },
      { step_key: 'step_d_albumina', values: { accepted: true } },
      { step_key: 'step_d_persiste_choque', values: { answer: true } },
      { step_key: 'step_d_dva', values: { accepted: true } },
      { step_key: 'step_d_hiperhidratacao_check', values: { answer: true } },
      { step_key: 'step_d_hiperhidratacao', values: { accepted: true } },
      { step_key: 'step_fases_dengue', values: { monitorado: true } },
      { step_key: 'step_diagnostico_laboratorial', values: { ack: true } },
    ],
  );
}

function scenarioCSyntheticMultipleChoice(): ScenarioResult {
  const stepsData = {
    steps: [
      { id: 'start', type: 'info', title: 'Start', next_step: 'classify' },
      {
        id: 'classify',
        type: 'multiple_choice',
        title: 'Classify',
        choices_next: { grave: 'treat_grave', moderado: 'treat_moderado', leve: 'treat_leve' },
      },
      {
        id: 'treat_grave',
        type: 'medication_prescription',
        title: 'Treatment Grave',
        medications: [{ name: 'Med A', dose: '10mg/kg', route: 'IV' }],
        next_step: 'end',
      },
      { id: 'treat_moderado', type: 'info', title: 'Treatment Moderado', next_step: 'end' },
      { id: 'treat_leve', type: 'info', title: 'Treatment Leve', next_step: 'end' },
      { id: 'end', type: 'info', title: 'End', next_step: null },
    ],
  };

  return runScenario(
    'synthetic_multiple_choice',
    stepsData,
    [
      { step_key: 'start', values: { ack: true } },
      { step_key: 'classify', values: { choice: 'grave' } },
      { step_key: 'treat_grave', values: { accepted: true } },
      { step_key: 'end', values: { ack: true } },
    ],
  );
}

function scenarioDOutsideProtocol(stepsData: Record<string, unknown>): ScenarioResult {
  return runScenario(
    'outside_protocol_scope',
    stepsData,
    [
      { step_key: 'step_0', values: { ack: true } },
      { step_key: 'step_1_gravidade', values: { checked_items: [] } },
      { step_key: 'step_1b_alerta', values: { checked_items: [] } },
      { step_key: 'step_fora_protocolo', values: { ack: true } },
    ],
  );
}

function scenarioEGroupDNoShock(stepsData: Record<string, unknown>): ScenarioResult {
  return runScenario(
    'group_d_no_shock',
    stepsData,
    [
      { step_key: 'step_0', values: { ack: true } },
      { step_key: 'step_1_gravidade', values: { checked_items: ['g3'] } },
      { step_key: 'step_d_exames', values: { ack: true } },
      { step_key: 'step_d_peso', values: { peso_kg: 20 } },
      { step_key: 'step_d_expansao', values: { peso_kg: '20' } },
      { step_key: 'step_d_avaliacao1', values: { answer: true } },
      { step_key: 'step_c_manutencao', values: { peso_kg: '20' } },
      { step_key: 'step_fases_dengue', values: { monitorado: true } },
      { step_key: 'step_diagnostico_laboratorial', values: { ack: true } },
    ],
  );
}

function scenarioFTitrationMaxReached(stepsData: Record<string, unknown>): ScenarioResult {
  return runScenario(
    'titration_max_reached',
    stepsData,
    [
      { step_key: 'step_0', values: { ack: true } },
      { step_key: 'step_1_gravidade', values: { checked_items: [] } },
      { step_key: 'step_1b_alerta', values: { checked_items: ['a1'] } },
      { step_key: 'step_c_exames', values: { ack: true } },
      { step_key: 'step_c_peso', values: { peso_kg: 15 } },
      { step_key: 'step_c_expansao', values: { peso_kg: '15' } },
      { step_key: 'step_c_avaliacao1', values: { answer: false } },
      { step_key: 'step_c_repeticao', values: { congestion: false }, loop_count: 0 },
      { step_key: 'step_c_repeticao', values: { congestion: false }, loop_count: 1 },
      { step_key: 'step_c_repeticao', values: { congestion: false }, loop_count: 2 },
      { step_key: 'step_c_avaliacao_horaria', values: { diurese: 'adequada' } },
      { step_key: 'step_c_avaliacao2', values: { answer: true } },
      { step_key: 'step_c_manutencao', values: { peso_kg: '15' } },
      { step_key: 'step_fases_dengue', values: { monitorado: true } },
      { step_key: 'step_diagnostico_laboratorial', values: { ack: true } },
    ],
  );
}

function scenarioGTitrationCongestion(stepsData: Record<string, unknown>): ScenarioResult {
  return runScenario(
    'titration_congestion',
    stepsData,
    [
      { step_key: 'step_0', values: { ack: true } },
      { step_key: 'step_1_gravidade', values: { checked_items: [] } },
      { step_key: 'step_1b_alerta', values: { checked_items: ['a1'] } },
      { step_key: 'step_c_exames', values: { ack: true } },
      { step_key: 'step_c_peso', values: { peso_kg: 10 } },
      { step_key: 'step_c_expansao', values: { peso_kg: '10' } },
      { step_key: 'step_c_avaliacao1', values: { answer: false } },
      { step_key: 'step_c_repeticao', values: { congestion: true }, loop_count: 0 },
      { step_key: 'step_c_avaliacao_horaria', values: { diurese: 'baixa' } },
      { step_key: 'step_c_avaliacao2', values: { answer: false } },
      { step_key: 'step_c_conduzir_d', values: { ack: true } },
      { step_key: 'step_d_persiste_choque', values: { answer: false } },
      { step_key: 'step_d_hiperhidratacao_check', values: { answer: false } },
      { step_key: 'step_fases_dengue', values: { monitorado: true } },
      { step_key: 'step_diagnostico_laboratorial', values: { ack: true } },
    ],
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[i + 1];
      i++;
    }
  }

  // Load dengue fixture
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf-8');
  const fixture = JSON.parse(fixtureRaw) as Array<{ fields: { steps_data: Record<string, unknown> } }>;
  const stepsData = fixture[1]!.fields.steps_data;

  const results: ScenarioResult[] = [];

  results.push(scenarioAGroupCFullPath(stepsData));
  results.push(scenarioBGroupDFullPath(stepsData));
  results.push(scenarioCSyntheticMultipleChoice());
  results.push(scenarioDOutsideProtocol(stepsData));
  results.push(scenarioEGroupDNoShock(stepsData));
  results.push(scenarioFTitrationMaxReached(stepsData));
  results.push(scenarioGTitrationCongestion(stepsData));

  const output = normalise({
    engine: 'javascript',
    engine_version: '1.0.0',
    fixture: 'dengue_guiado.json',
    scenarios: results,
  });

  const jsonStr = JSON.stringify(output, null, 2);

  if (outputPath) {
    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(outputPath, jsonStr, 'utf-8');
    console.error(`Written to ${outputPath}`);
  } else {
    console.log(jsonStr);
  }
}

main();
