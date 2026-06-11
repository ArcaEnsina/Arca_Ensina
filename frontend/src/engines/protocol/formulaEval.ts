import Decimal from 'decimal.js';

// Configure: 20 significant digits, round half-up (matches Python Decimal default)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

type Token =
  | { kind: 'num'; value: string }
  | { kind: 'name'; value: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '**' }
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
    } else if (ch === '*' && input[i + 1] === '*') {
      tokens.push({ kind: 'op', value: '**' });
      i += 2;
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'op', value: ch });
      i++;
    } else if (/[0-9.]/.test(ch!)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        num += input[i];
        i++;
      }
      // Validate: at most one dot
      if ((num.match(/\./g) || []).length > 1) {
        throw new Error(`Numero invalido na formula: ${num}`);
      }
      tokens.push({ kind: 'num', value: num });
    } else if (/[A-Za-z_]/.test(ch!)) {
      let name = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i]!)) {
        name += input[i];
        i++;
      }
      tokens.push({ kind: 'name', value: name });
    } else {
      throw new Error(`Caractere invalido na formula: ${ch}`);
    }
  }
  return tokens;
}

function toDecimal(value: unknown): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === 'number') return new Decimal(value);
  if (typeof value === 'string') return new Decimal(value);
  throw new Error(`Valor nao numerico no contexto: ${String(value)}`);
}

export function evaluateFormula(
  formula: string,
  context: Record<string, unknown>,
): string {
  const tokens = tokenize(formula);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function parseExpr(): Decimal {
    let value = parseTerm();
    while (peek()?.kind === 'op') {
      const op = peek() as { kind: 'op'; value: string };
      if (op.value !== '+' && op.value !== '-') break;
      pos++;
      const rhs = parseTerm();
      value = op.value === '+' ? value.plus(rhs) : value.minus(rhs);
    }
    return value;
  }

  function parseTerm(): Decimal {
    let value = parsePower();
    while (peek()?.kind === 'op') {
      const op = peek() as { kind: 'op'; value: string };
      if (op.value !== '*' && op.value !== '/') break;
      pos++;
      const rhs = parsePower();
      value = op.value === '*' ? value.times(rhs) : value.div(rhs);
    }
    return value;
  }

  function parsePower(): Decimal {
    let value = parseFactor();
    if (peek()?.kind === 'op') {
      const op = peek() as { kind: 'op'; value: string };
      if (op.value === '**') {
        pos++;
        const rhs = parseFactor();
        value = value.pow(rhs);
      }
    }
    return value;
  }

  function parseFactor(): Decimal {
    const tok = peek();
    if (!tok) throw new Error('Formula incompleta');
    if (tok.kind === 'op' && tok.value === '-') {
      pos++;
      return parseFactor().negated();
    }
    if (tok.kind === 'num') {
      pos++;
      return new Decimal(tok.value);
    }
    if (tok.kind === 'name') {
      pos++;
      const raw = context[tok.value];
      if (raw === undefined || raw === null) {
        throw new Error(`Variavel desconhecida na formula: ${tok.value}`);
      }
      return toDecimal(raw);
    }
    if (tok.kind === 'lparen') {
      pos++;
      const value = parseExpr();
      if (peek()?.kind !== 'rparen') throw new Error('Parentese nao fechado');
      pos++;
      return value;
    }
    throw new Error('Formula invalida');
  }

  const result = parseExpr();
  if (pos !== tokens.length) {
    throw new Error('Tokens extras apos expressao completa');
  }
  return result.toString();
}

export function evaluateFormulaAsDecimal(
  formula: string,
  context: Record<string, unknown>,
): Decimal {
  return new Decimal(evaluateFormula(formula, context));
}

/**
 * Format a Decimal result for display, trimming trailing zeros
 * (e.g. "300.0" -> "300", "12.5" -> "12.5").
 */
export function formatDecimal(value: string): string {
  const d = new Decimal(value);
  return d.equals(d.floor()) ? d.floor().toString() : d.toString();
}
