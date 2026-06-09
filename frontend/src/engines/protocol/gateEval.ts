type AstNode =
  | { type: 'constant'; value: unknown }
  | { type: 'name'; id: string }
  | { type: 'boolOp'; op: 'and' | 'or'; values: AstNode[] }
  | { type: 'compare'; left: AstNode; ops: CompareOp[]; comparators: AstNode[] }
  | { type: 'unaryOp'; op: 'not'; operand: AstNode };

type CompareOp = 'Eq' | 'NotEq' | 'Lt' | 'LtE' | 'Gt' | 'GtE' | 'In' | 'NotIn';

type GateToken =
  | { kind: 'name'; value: string }
  | { kind: 'number'; value: string }
  | { kind: 'string'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'op'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'lbracket' }
  | { kind: 'rbracket' }
  | { kind: 'comma' };

function tokenizeGateExpression(input: string): GateToken[] {
  const tokens: GateToken[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch === undefined) break;
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          i++;
          str += input[i];
        } else {
          str += input[i];
        }
        i++;
      }
      if (i >= input.length) throw new Error('String nao fechada');
      i++; // skip closing quote
      tokens.push({ kind: 'string', value: str });
      continue;
    }

    // Brackets
    if (ch === '[') { tokens.push({ kind: 'lbracket' }); i++; continue; }
    if (ch === ']') { tokens.push({ kind: 'rbracket' }); i++; continue; }
    if (ch === '(') { tokens.push({ kind: 'lparen' }); i++; continue; }
    if (ch === ')') { tokens.push({ kind: 'rparen' }); i++; continue; }
    if (ch === ',') { tokens.push({ kind: 'comma' }); i++; continue; }

    // Multi-char operators
    if (ch === '!' && input[i + 1] === '=') { tokens.push({ kind: 'op', value: '!=' }); i += 2; continue; }
    if (ch === '=' && input[i + 1] === '=') { tokens.push({ kind: 'op', value: '==' }); i += 2; continue; }
    if (ch === '<' && input[i + 1] === '=') { tokens.push({ kind: 'op', value: '<=' }); i += 2; continue; }
    if (ch === '>' && input[i + 1] === '=') { tokens.push({ kind: 'op', value: '>=' }); i += 2; continue; }
    if (ch === '<') { tokens.push({ kind: 'op', value: '<' }); i++; continue; }
    if (ch === '>') { tokens.push({ kind: 'op', value: '>' }); i++; continue; }

    // Numbers (int or float)
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        num += input[i];
        i++;
      }
      tokens.push({ kind: 'number', value: num });
      continue;
    }

    // Names and keywords
    if (/[A-Za-z_]/.test(ch)) {
      let name = '';
      while (i < input.length && /[A-Za-z0-9_.]/.test(input[i]!)) {
        name += input[i];
        i++;
      }
      if (name === 'True') {
        tokens.push({ kind: 'bool', value: true });
      } else if (name === 'False') {
        tokens.push({ kind: 'bool', value: false });
      } else if (name === 'and') {
        tokens.push({ kind: 'op', value: 'and' });
      } else if (name === 'or') {
        tokens.push({ kind: 'op', value: 'or' });
      } else if (name === 'not') {
        // Peek: if followed by 'in', this is 'not in'
        let j = i;
        while (j < input.length && input[j] === ' ') j++;
        if (j < input.length && input.slice(j, j + 2) === 'in') {
          tokens.push({ kind: 'op', value: 'not in' });
          i = j + 2;
        } else {
          tokens.push({ kind: 'op', value: 'not' });
        }
      } else if (name === 'in') {
        tokens.push({ kind: 'op', value: 'in' });
      } else {
        tokens.push({ kind: 'name', value: name });
      }
      continue;
    }

    throw new Error(`Caractere inesperado na expressao booleana: '${ch}'`);
  }

  return tokens;
}

// ---- Parser (recursive descent) ----

class GateParser {
  private tokens: GateToken[];
  private pos = 0;

  constructor(tokens: GateToken[]) {
    this.tokens = tokens;
  }

  private peek(): GateToken | undefined {
    return this.tokens[this.pos];
  }

  private advance(): GateToken {
    const tok = this.tokens[this.pos];
    if (!tok) throw new Error('Expressao incompleta');
    this.pos++;
    return tok;
  }

  parse(): AstNode {
    const node = this.parseOrExpr();
    if (this.pos !== this.tokens.length) {
      throw new Error('Tokens extras apos expressao completa');
    }
    return node;
  }

  // or_expr = and_expr ('or' and_expr)*
  private parseOrExpr(): AstNode {
    let left = this.parseAndExpr();
    while (this.peek()?.kind === 'op' && (this.peek() as { value: string }).value === 'or') {
      this.advance();
      const right = this.parseAndExpr();
      left = { type: 'boolOp', op: 'or', values: [left, right] };
    }
    return left;
  }

  // and_expr = not_expr ('and' not_expr)*
  private parseAndExpr(): AstNode {
    let left = this.parseNotExpr();
    while (this.peek()?.kind === 'op' && (this.peek() as { value: string }).value === 'and') {
      this.advance();
      const right = this.parseNotExpr();
      left = { type: 'boolOp', op: 'and', values: [left, right] };
    }
    return left;
  }

  // not_expr = 'not' not_expr | comparison
  private parseNotExpr(): AstNode {
    if (this.peek()?.kind === 'op' && (this.peek() as { value: string }).value === 'not') {
      this.advance();
      const operand = this.parseNotExpr();
      return { type: 'unaryOp', op: 'not', operand };
    }
    return this.parseComparison();
  }

  // comparison = primary (comp_op primary)*
  // where comp_op is one of: ==, !=, <, >, <=, >=, in, not in
  private parseComparison(): AstNode {
    const left = this.parsePrimary();
    const ops: CompareOp[] = [];
    const comparators: AstNode[] = [];

    while (this.isCompareOp(this.peek())) {
      const opToken = this.advance();
      const op = this.toCompareOp(opToken);
      // 'not in' is already consumed as a single token
      const right = this.parsePrimary();
      ops.push(op);
      comparators.push(right);
    }

    if (ops.length === 0) return left;
    return { type: 'compare', left, ops, comparators };
  }

  // primary = NUMBER | STRING | BOOL | NAME | '(' or_expr ')' | '[' list ']'
  private parsePrimary(): AstNode {
    const tok = this.peek();
    if (!tok) throw new Error('Expressao incompleta');

    if (tok.kind === 'number') {
      this.advance();
      return { type: 'constant', value: Number(tok.value) };
    }
    if (tok.kind === 'string') {
      this.advance();
      return { type: 'constant', value: tok.value };
    }
    if (tok.kind === 'bool') {
      this.advance();
      return { type: 'constant', value: tok.value };
    }
    if (tok.kind === 'name') {
      this.advance();
      return { type: 'name', id: tok.value };
    }
    if (tok.kind === 'lparen') {
      this.advance();
      const inner = this.parseOrExpr();
      const close = this.advance();
      if (close.kind !== 'rparen') throw new Error('Parentese nao fechado');
      return inner;
    }
    if (tok.kind === 'lbracket') {
      return this.parseList();
    }

    throw new Error(`Token inesperado: ${JSON.stringify(tok)}`);
  }

  // Parse [item, item, ...] as a constant array
  private parseList(): AstNode {
    this.advance(); // consume '['
    const items: unknown[] = [];
    while (this.peek()?.kind !== 'rbracket') {
      const tok = this.advance();
      if (tok.kind === 'number') items.push(Number(tok.value));
      else if (tok.kind === 'string') items.push(tok.value);
      else if (tok.kind === 'bool') items.push(tok.value);
      else throw new Error(`Item invalido na lista: ${JSON.stringify(tok)}`);
      if (this.peek()?.kind === 'comma') this.advance();
    }
    this.advance(); // consume ']'
    return { type: 'constant', value: items };
  }

  private isCompareOp(tok: GateToken | undefined): boolean {
    if (!tok || tok.kind !== 'op') return false;
    return ['==', '!=', '<', '>', '<=', '>=', 'in', 'not in'].includes(tok.value);
  }

  private toCompareOp(tok: GateToken): CompareOp {
    const v = (tok as { value: string }).value;
    switch (v) {
      case '==': return 'Eq';
      case '!=': return 'NotEq';
      case '<': return 'Lt';
      case '<=': return 'LtE';
      case '>': return 'Gt';
      case '>=': return 'GtE';
      case 'in': return 'In';
      case 'not in': return 'NotIn';
      default: throw new Error(`Operador de comparacao nao suportado: ${v}`);
    }
  }
}

// ---- Evaluator ----

function resolveVariable(name: string, context: Record<string, unknown>): unknown {
  // Handle context.var dotted names — split on first dot
  if (name.startsWith('context.')) {
    const key = name.slice('context.'.length);
    return context[key];
  }
  return context[name];
}

function evalNode(node: AstNode, context: Record<string, unknown>): unknown {
  switch (node.type) {
    case 'constant':
      return node.value;

    case 'name': {
      if (node.id === 'True') return true;
      if (node.id === 'False') return false;
      return resolveVariable(node.id, context);
    }

    case 'boolOp': {
      const values = node.values.map((v) => evalNode(v, context));
      if (node.op === 'and') return values.every(Boolean);
      // or
      return values.some(Boolean);
    }

    case 'unaryOp':
      if (node.op === 'not') return !evalNode(node.operand, context);
      throw new Error('Operador unario nao suportado');

    case 'compare': {
      let left = evalNode(node.left, context);
      for (let i = 0; i < node.ops.length; i++) {
        const right = evalNode(node.comparators[i]!, context);
        const op = node.ops[i]!;
        let result: boolean;
        switch (op) {
          case 'Eq': result = left === right; break;
          case 'NotEq': result = left !== right; break;
          case 'Lt': result = (left as number) < (right as number); break;
          case 'LtE': result = (left as number) <= (right as number); break;
          case 'Gt': result = (left as number) > (right as number); break;
          case 'GtE': result = (left as number) >= (right as number); break;
          case 'In': result = Array.isArray(right) && right.includes(left); break;
          case 'NotIn': result = Array.isArray(right) && !right.includes(left); break;
          default: throw new Error(`Operador nao suportado: ${op}`);
        }
        if (!result) return false;
        left = right;
      }
      return true;
    }

    default:
      throw new Error(`No AST nao suportado: ${(node as { type: string }).type}`);
  }
}

/**
 * Safely evaluate a boolean expression string against a context dict.
 *
 * Returns true/false. Matches Python _evaluate_boolean_expression behavior.
 * Throws on invalid expression syntax.
 */
export function evaluateBooleanExpression(
  expression: string,
  context: Record<string, unknown>,
): boolean {
  const tokens = tokenizeGateExpression(expression);
  const parser = new GateParser(tokens);
  const ast = parser.parse();
  return Boolean(evalNode(ast, context));
}
