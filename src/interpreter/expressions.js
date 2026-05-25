import { callNativeFunction } from './native-functions.js';
import { normalizeKeyword, splitArguments } from './tokenizer.js';

export async function evaluateExpression(expression, runtime) {
  return new ExpressionParser(expression, runtime).parse();
}

class ExpressionParser {
  constructor(expression, runtime) {
    this.expression = expression;
    this.runtime = runtime;
    this.tokens = tokenizeExpression(expression);
    this.index = 0;
  }

  async parse() {
    const value = await this.parseOr();
    if (!this.isAtEnd()) throw new Error(`Token inesperado: ${this.peek().value}.`);
    return value;
  }

  async parseOr() {
    let left = await this.parseAnd();
    while (this.matchKeyword('ou')) {
      left = Boolean(left) || Boolean(await this.parseAnd());
    }
    return left;
  }

  async parseAnd() {
    let left = await this.parseEquality();
    while (this.matchKeyword('e')) {
      left = Boolean(left) && Boolean(await this.parseEquality());
    }
    return left;
  }

  async parseEquality() {
    let left = await this.parseComparison();
    while (this.matchOperator('=', '<>', '==', '!=')) {
      const operator = this.previous().value;
      const right = await this.parseComparison();
      left = operator === '=' || operator === '==' ? left === right : left !== right;
    }
    return left;
  }

  async parseComparison() {
    let left = await this.parseTerm();
    while (this.matchOperator('<', '<=', '>', '>=')) {
      const operator = this.previous().value;
      const right = await this.parseTerm();
      if (operator === '<') left = left < right;
      if (operator === '<=') left = left <= right;
      if (operator === '>') left = left > right;
      if (operator === '>=') left = left >= right;
    }
    return left;
  }

  async parseTerm() {
    let left = await this.parseFactor();
    while (this.matchOperator('+', '-')) {
      const operator = this.previous().value;
      const right = await this.parseFactor();
      left = operator === '+' ? left + right : Number(left) - Number(right);
    }
    return left;
  }

  async parseFactor() {
    let left = await this.parseUnary();
    while (this.matchOperator('*', '/') || this.matchKeyword('div', 'mod')) {
      const operator = this.previous().value;
      const right = await this.parseUnary();
      if (operator === '*') left = Number(left) * Number(right);
      if (operator === '/' || operator === 'div') left = Number(left) / Number(right);
      if (operator === 'mod') left = Number(left) % Number(right);
    }
    return left;
  }

  async parseUnary() {
    if (this.matchOperator('-')) return -Number(await this.parseUnary());
    if (this.matchKeyword('nao')) return !Boolean(await this.parseUnary());
    return this.parsePrimary();
  }

  async parsePrimary() {
    if (this.matchType('number')) return Number(this.previous().value);
    if (this.matchType('string')) return this.previous().value;

    if (this.matchKeyword('verdadeiro')) return true;
    if (this.matchKeyword('falso')) return false;

    if (this.matchType('identifier')) {
      const name = this.previous().value;
      if (this.matchOperator('(')) return this.evaluateFunctionCall(name);
      if (!this.matchOperator('[')) return this.runtime.getValue(name);

      return this.runtime.getValue(name, this.readDelimitedRaw('[', ']', `Indice de vetor nao fechado para ${name}.`));
    }

    if (this.matchOperator('(')) {
      const value = await this.parseOr();
      this.consumeOperator(')', 'Parenteses nao fechado.');
      return value;
    }

    throw new Error(`Token inesperado: ${this.peek().value}.`);
  }

  async evaluateFunctionCall(name) {
    const rawArgs = this.readDelimitedRaw('(', ')', `Chamada de funcao nao fechada para ${name}.`);
    const argExpressions = rawArgs.trim() ? splitArguments(rawArgs) : [];
    const args = [];
    for (const arg of argExpressions) {
      args.push(await this.runtime.evaluate(arg));
    }
    const userFunctionValue = await this.runtime.callFunction(name, args, argExpressions);
    if (userFunctionValue !== null) return userFunctionValue;

    return callNativeFunction(name, args);
  }

  readDelimitedRaw(open, close, message) {
    const start = this.previous().end;
    let depth = 1;
    let end = start;

    while (!this.isAtEnd() && depth > 0) {
      const token = this.advance();
      if (token.value === open) depth += 1;
      if (token.value === close) depth -= 1;
      if (depth > 0) end = token.end;
    }

    if (depth !== 0) throw new Error(message);
    return this.expression.slice(start, end).trim();
  }

  matchType(type) {
    if (this.peek().type !== type) return false;
    this.advance();
    return true;
  }

  matchKeyword(...values) {
    if (this.peek().type !== 'identifier') return false;
    if (!values.includes(normalizeKeyword(this.peek().value))) return false;
    this.advance();
    return true;
  }

  matchOperator(...values) {
    if (this.peek().type !== 'operator') return false;
    if (!values.includes(this.peek().value)) return false;
    this.advance();
    return true;
  }

  consumeOperator(value, message) {
    if (this.matchOperator(value)) return;
    throw new Error(message);
  }

  advance() {
    if (!this.isAtEnd()) this.index += 1;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === 'eof';
  }

  peek() {
    return this.tokens[this.index];
  }

  previous() {
    return this.tokens[this.index - 1];
  }
}

function tokenizeExpression(expression) {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '"') {
      const start = index;
      index += 1;
      let value = '';
      while (index < expression.length && expression[index] !== '"') {
        value += expression[index];
        index += 1;
      }
      if (expression[index] !== '"') throw new Error('Texto nao fechado.');
      index += 1;
      tokens.push({ type: 'string', value, start, end: index });
      continue;
    }

    if (/\d/.test(char)) {
      const start = index;
      while (index < expression.length && /\d/.test(expression[index])) index += 1;
      if (expression[index] === '.') {
        index += 1;
        while (index < expression.length && /\d/.test(expression[index])) index += 1;
      }
      tokens.push({ type: 'number', value: expression.slice(start, index), start, end: index });
      continue;
    }

    if (/[a-zA-Z_\u00C0-\u017F]/.test(char)) {
      const start = index;
      index += 1;
      while (index < expression.length && /[a-zA-Z0-9_\u00C0-\u017F]/.test(expression[index])) index += 1;
      tokens.push({ type: 'identifier', value: expression.slice(start, index), start, end: index });
      continue;
    }

    const twoChars = expression.slice(index, index + 2);
    if (['<=', '>=', '<>', '!=', '=='].includes(twoChars)) {
      tokens.push({ type: 'operator', value: twoChars, start: index, end: index + 2 });
      index += 2;
      continue;
    }

    if ('+-*/%=<>()[],'.includes(char)) {
      tokens.push({ type: 'operator', value: char, start: index, end: index + 1 });
      index += 1;
      continue;
    }

    throw new Error(`Caractere invalido: ${char}.`);
  }

  tokens.push({ type: 'eof', value: 'fim da expressao', start: index, end: index });
  return tokens;
}
