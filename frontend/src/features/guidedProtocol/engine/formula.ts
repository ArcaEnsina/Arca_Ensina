/**
 * Tiny safe arithmetic evaluator for derived_calc display heroes.
 *
 * Supports + - * / and parentheses over numeric variables resolved from a
 * context map (e.g. `peso_kg * 10`). No identifiers other than context keys are
 * allowed and there is no function/property access — so it is safe to run on
 * untrusted protocol JSON. The authoritative computation still lives in the
 * backend engine; this only mirrors it for on-screen display.
 */

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i++;
    } else if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i++;
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'op', value: ch });
      i++;
    } else if (/[0-9.]/.test(ch!)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        num += input[i];
        i++;
      }
      tokens.push({ kind: 'num', value: Number(num) });
    } else if (/[A-Za-z_]/.test(ch!)) {
      let name = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i]!)) {
        name += input[i];
        i++;
      }
      tokens.push({ kind: 'name', value: name });
    } else {
      throw new Error(`Caractere inválido na fórmula: ${ch}`);
    }
  }
  return tokens;
}

/**
 * Evaluate a formula against a context map. Returns null if the formula
 * references an unknown/non-numeric variable or is otherwise unevaluable.
 */
export function evalFormula(
  formula: string,
  context: Record<string, unknown>,
): number | null {
  let tokens: Token[];
  try {
    tokens = tokenize(formula);
  } catch {
    return null;
  }

  let pos = 0;
  const peek = () => tokens[pos];

  function parseExpr(): number {
    let value = parseTerm();
    while (peek()?.kind === 'op') {
      const op = peek() as { kind: 'op'; value: string };
      if (op.value !== '+' && op.value !== '-') break;
      pos++;
      const rhs = parseTerm();
      value = op.value === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek()?.kind === 'op') {
      const op = peek() as { kind: 'op'; value: string };
      if (op.value !== '*' && op.value !== '/') break;
      pos++;
      const rhs = parseFactor();
      value = op.value === '*' ? value * rhs : value / rhs;
    }
    return value;
  }

  function parseFactor(): number {
    const tok = peek();
    if (!tok) throw new Error('Fórmula incompleta');
    if (tok.kind === 'op' && tok.value === '-') {
      pos++;
      return -parseFactor();
    }
    if (tok.kind === 'num') {
      pos++;
      return tok.value;
    }
    if (tok.kind === 'name') {
      pos++;
      const raw = context[tok.value];
      const num = typeof raw === 'string' ? Number(raw) : raw;
      if (typeof num !== 'number' || Number.isNaN(num)) {
        throw new Error(`Variável desconhecida: ${tok.value}`);
      }
      return num;
    }
    if (tok.kind === 'lparen') {
      pos++;
      const value = parseExpr();
      if (peek()?.kind !== 'rparen') throw new Error('Parêntese não fechado');
      pos++;
      return value;
    }
    throw new Error('Fórmula inválida');
  }

  try {
    const result = parseExpr();
    if (pos !== tokens.length) return null;
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/** Format a number for display, trimming trailing zeros (e.g. 300.0 → "300"). */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
