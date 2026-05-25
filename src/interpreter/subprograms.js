import { ReturnSignal } from './control-signals.js';
import {
  createScope,
  getBindingType,
  getBindingValue,
  normalizeName,
  parameterType
} from './scope-bindings.js';
import {
  coerceValue,
  formatType,
  getVectorValue,
  isVectorType,
  parseIndexExpressions,
  parseTarget,
  sameType
} from './vectors.js';

export async function callProcedure(runtime, name, argExpressions, suggestCommand) {
  const subprogram = getSubprogram(runtime, name, 'procedure');
  if (!subprogram) throw new Error(`Procedimento nao suportado: ${name}.${suggestCommand(name)}`);
  const value = await executeSubprogram(runtime, subprogram, argExpressions, false);
  if (value instanceof ReturnSignal) throw new Error(`Procedimento ${name} nao pode retornar valor.`);
}

export async function callFunction(runtime, name, args, argExpressions = []) {
  const subprogram = getSubprogram(runtime, name, 'function');
  if (!subprogram) return null;
  const value = await executeSubprogram(runtime, subprogram, argExpressions.length ? argExpressions : args, argExpressions.length === 0);
  if (value instanceof ReturnSignal) return coerceValue(value.value, subprogram.returnType);
  throw new Error(`Funcao ${name} terminou sem retorne.`);
}

function getSubprogram(runtime, name, expectedKind) {
  const subprogram = runtime.subprograms.get(normalizeName(name));
  if (!subprogram) return null;
  if (subprogram.kind !== expectedKind) {
    throw new Error(expectedKind === 'function'
      ? `${name} foi declarado como procedimento, nao funcao.`
      : `${name} foi declarado como funcao, nao procedimento.`);
  }
  return subprogram;
}

async function executeSubprogram(runtime, subprogram, args, argsAreValues) {
  if (args.length !== subprogram.params.length) {
    throw new Error(`${subprogram.name} esperava ${subprogram.params.length} argumento(s), recebeu ${args.length}.`);
  }

  const scope = createScope();
  runtime.initializeDeclarations(subprogram.declarations, scope);
  for (let index = 0; index < subprogram.params.length; index += 1) {
    const param = subprogram.params[index];
    const key = normalizeName(param.name);
    const type = parameterType(param);
    if (param.byReference) {
      const binding = await resolveReferenceArgument(runtime, args[index], param);
      scope.aliases.set(key, binding);
      scope.types.set(key, type);
      continue;
    }

    const value = argsAreValues ? args[index] : await runtime.evaluate(args[index]);
    scope.types.set(key, type);
    scope.values.set(key, coerceValue(value, type));
  }

  runtime.scopes.push(scope);
  try {
    await runtime.execute(subprogram.statements);
  } catch (error) {
    if (error instanceof ReturnSignal) return error;
    throw error;
  } finally {
    runtime.scopes.pop();
  }

  return null;
}

async function resolveReferenceArgument(runtime, expression, param) {
  let target;
  try {
    target = parseTarget(expression);
  } catch {
    throw new Error(`Parametro var ${param.name} deve receber uma variavel ou item de vetor.`);
  }

  const binding = runtime.findBinding(normalizeName(target.name));
  if (!binding) throw new Error(`Variavel nao declarada: ${target.name}.`);

  const type = getBindingType(binding);
  const expectedType = parameterType(param);
  if (target.indexExpression == null) {
    if (!sameType(type, expectedType)) {
      throw new Error(`Parametro var ${param.name} esperava ${formatType(expectedType)}, recebeu ${formatType(type)}.`);
    }
    return binding;
  }

  if (isVectorType(expectedType)) {
    throw new Error(`Parametro var ${param.name} esperava ${formatType(expectedType)}, recebeu item de vetor.`);
  }
  if (!isVectorType(type)) throw new Error(`${target.name} nao foi declarado como vetor.`);
  if (type.itemType !== expectedType) {
    throw new Error(`Parametro var ${param.name} esperava ${param.type}, recebeu ${type.itemType}.`);
  }
  const indexes = [];
  for (const item of parseIndexExpressions(target.indexExpression)) {
    indexes.push(Number(await runtime.evaluate(item)));
  }
  getVectorValue(getBindingValue(binding), type, indexes, target.name);
  return { scope: binding.scope, key: binding.key, indexes };
}
