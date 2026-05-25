import { evaluateExpression } from './expressions.js';
import { suggestCommand } from './command-suggestions.js';
import { findSelectedChoiceCase } from './choice-runtime.js';
import { BreakSignal, ReturnSignal } from './control-signals.js';
import { initializeDeclarations as initializeScopeDeclarations } from './declarations.js';
import { createDebugStep } from './debug-snapshot.js';
import {
  assertLoopGuard,
  createExecutionState,
  nextInput
} from './execution-state.js';
import { formatWriteArgument } from './output-format.js';
import { executeUtilityStatement } from './runtime-commands.js';
import { snapshotRuntimeVariableTypes, snapshotRuntimeVariables } from './runtime-snapshot.js';
import { createScope, normalizeName } from './scope-bindings.js';
import { callFunction as callUserFunction, callProcedure as callUserProcedure } from './subprograms.js';
import {
  coerceRuntimeInput,
  getRuntimeValue,
  getRuntimeVariableType,
  setRuntimeValue
} from './variable-access.js';
import {
  parseIndexExpressions
} from './vectors.js';

export async function executeAst(ast, options = {}) {
  const runtime = new Runtime(ast, options);
  await runtime.execute(ast.statements);
  runtime.flushLine();
  return { output: runtime.output, steps: runtime.steps };
}

export function evaluateSnapshotExpression(snapshot, expression) {
  if (!snapshot?.step) throw new Error('Sem passo de depuração para avaliar.');
  const runtime = createSnapshotRuntime(snapshot.step);
  return runtime.evaluate(expression);
}

function createSnapshotRuntime(step) {
  const variables = step.variables ?? {};

  return {
    async evaluate(expression) {
      try {
        return await evaluateExpression(expression, this);
      } catch (error) {
        throw new Error(`Erro ao avaliar watch "${expression}": ${error.message}`);
      }
    },
    async getValue(name, indexExpression) {
      const key = normalizeName(name);
      if (!Object.hasOwn(variables, key)) throw new Error(`Variavel nao declarada: ${name}`);
      const value = variables[key];
      if (!indexExpression) return value;

      const indexes = [];
      for (const item of parseIndexExpressions(indexExpression)) {
        indexes.push(Number(await this.evaluate(item)));
      }
      let current = value;
      for (const index of indexes) {
        if (current == null || !Object.hasOwn(current, String(index))) {
          throw new Error(`Indice ${index} fora do intervalo de ${name}.`);
        }
        current = current[String(index)];
      }
      return current;
    },
    async callFunction() {
      return null;
    }
  };
}

class Runtime {
  constructor(ast, options) {
    this.options = options;
    this.scopes = [createScope()];
    this.subprograms = new Map((ast.subprograms ?? []).map((subprogram) => [normalizeName(subprogram.name), subprogram]));
    this.output = [];
    this.steps = [];
    this.debug = Boolean(options.debug);
    this.currentLine = '';
    this.executionState = createExecutionState(options);
    this.echo = false;
    this.timerEnabled = false;
    this.timerStartedAt = null;

    initializeScopeDeclarations(ast.declarations, this.currentScope());
  }

  async execute(statements) {
    for (const statement of statements) {
      await this.executeStatement(statement);
    }
  }

  async executeStatement(statement) {
    try {
      await this.executeStatementBody(statement);
    } catch (error) {
      if (error instanceof BreakSignal) throw error;
      if (error instanceof ReturnSignal) throw error;
      if (statement.line && !/^Linha \d+:/.test(error.message)) {
        throw new Error(`Linha ${statement.line}: ${error.message}`);
      }
      throw error;
    }
  }

  async executeStatementBody(statement) {
    if (this.timerEnabled) {
      const delay = this.options.timerDelay ?? 500;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    await this.captureStep(statement, 'before');

    if (statement.type === 'assign') {
      await this.setValue(statement.target ?? statement.name, await this.evaluate(statement.expression));
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'write') {
      this.currentLine += (await Promise.all(statement.args.map((arg) => this.evaluateWriteArg(arg)))).join('');
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'writeLine') {
      this.currentLine += (await Promise.all(statement.args.map((arg) => this.evaluateWriteArg(arg)))).join('');
      this.flushLine(true);
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'read') {
      for (const name of statement.names) {
        const type = getRuntimeVariableType(this, name) || 'inteiro';
        const val = await nextInput(this.executionState, { name, type, line: statement.line });
        
        if (this.echo) {
          this.currentLine += val;
          this.flushLine(true);
        }

        await this.setValue(name, this.coerceInput(name, val));
      }
      await this.captureStep(statement, 'after');
      return;
    }

    if (await executeUtilityStatement(this, statement)) {
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'break') {
      await this.captureStep(statement, 'after');
      throw new BreakSignal();
    }

    if (statement.type === 'return') {
      await this.captureStep(statement, 'after');
      throw new ReturnSignal(await this.evaluate(statement.expression));
    }

    if (statement.type === 'procedureCall') {
      await this.callProcedure(statement.name, statement.args);
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'if') {
      await this.execute(await this.evaluate(statement.condition) ? statement.thenStatements : statement.elseStatements);
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'for') {
      const start = Number(await this.evaluate(statement.start));
      const end = Number(await this.evaluate(statement.end));
      const step = Number(await this.evaluate(statement.step));
      if (step === 0) throw new Error('Passo do para nao pode ser zero.');

      for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
        await this.setValue(statement.variable, value);
        try {
          await this.execute(statement.statements);
        } catch (error) {
          if (error instanceof BreakSignal) break;
          throw error;
        }
      }
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'while') {
      let guard = 0;
      while (await this.evaluate(statement.condition)) {
        guard += 1;
        assertLoopGuard(this.executionState, guard, 'enquanto');
        try {
          await this.execute(statement.statements);
        } catch (error) {
          if (error instanceof BreakSignal) break;
          throw error;
        }
      }
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'repeat') {
      let guard = 0;
      do {
        guard += 1;
        assertLoopGuard(this.executionState, guard, 'repita');
        try {
          await this.execute(statement.statements);
        } catch (error) {
          if (error instanceof BreakSignal) break;
          throw error;
        }
      } while (!await this.evaluate(statement.condition));
      await this.captureStep(statement, 'after');
      return;
    }

    if (statement.type === 'choice') {
      const value = await this.evaluate(statement.expression);
      const selected = await findSelectedChoiceCase(this, value, statement.cases);
      await this.execute(selected ? selected.statements : statement.defaultStatements);
      await this.captureStep(statement, 'after');
      return;
    }

    throw new Error(`Statement desconhecido: ${statement.type}`);
  }

  async evaluate(expression) {
    try {
      return await evaluateExpression(expression, this);
    } catch (error) {
      throw new Error(`Erro ao avaliar "${expression}": ${error.message}`);
    }
  }

  async evaluateWriteArg(argument) {
    return formatWriteArgument(argument, this);
  }

  initializeDeclarations(declarations, scope) {
    initializeScopeDeclarations(declarations, scope);
  }

  async getValue(name, indexExpression = null) {
    return getRuntimeValue(this, name, indexExpression);
  }

  async setValue(name, value) {
    return setRuntimeValue(this, name, value);
  }

  coerceInput(name, value) {
    return coerceRuntimeInput(this, name, value);
  }

  async callProcedure(name, argExpressions) {
    return callUserProcedure(this, name, argExpressions, suggestCommand);
  }

  async callFunction(name, args, argExpressions = []) {
    return callUserFunction(this, name, args, argExpressions);
  }

  currentScope() {
    return this.scopes.at(-1);
  }

  findBinding(key) {
    for (let index = this.scopes.length - 1; index >= 0; index -= 1) {
      const scope = this.scopes[index];
      if (scope.values.has(key)) return { scope, key };
      if (scope.aliases.has(key)) return scope.aliases.get(key);
    }
    return null;
  }

  flushLine(force = false) {
    if (force || this.currentLine !== '') {
      this.output.push(this.currentLine);
      this.currentLine = '';
    }
  }

  async captureStep(statement, phase) {
    if (!this.debug) return;

    const step = createDebugStep(statement, phase, this);
    this.steps.push(step);
    if (typeof this.options?.onDebugStep === 'function') {
      await this.options.onDebugStep(step);
    }
  }

  snapshotVariables() {
    return snapshotRuntimeVariables(this);
  }

  snapshotVariableTypes() {
    return snapshotRuntimeVariableTypes(this);
  }
}
