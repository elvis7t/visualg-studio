import {
  getBindingType,
  getBindingValue,
  normalizeName,
  setBindingValue
} from './scope-bindings.js';
import {
  coerceValue,
  getVectorValue,
  isVectorType,
  parseIndexExpressions,
  parseTarget,
  setVectorValue
} from './vectors.js';

export async function getRuntimeValue(runtime, name, indexExpression = null) {
  const key = normalizeName(name);
  const binding = runtime.findBinding(key);
  if (!binding) throw new Error(`Variavel nao declarada: ${name}.`);

  const type = getBindingType(binding);
  const value = getBindingValue(binding);
  if (indexExpression == null) {
    if (isVectorType(type)) throw new Error(`${name} precisa de indice.`);
    return value;
  }

  if (!isVectorType(type)) throw new Error(`${name} nao foi declarado como vetor.`);
  return getVectorValue(value, type, await evaluateIndexes(runtime, indexExpression), name);
}

export async function setRuntimeValue(runtime, name, value) {
  const target = parseTarget(name);
  const key = normalizeName(target.name);
  const binding = runtime.findBinding(key);
  if (!binding) throw new Error(`Variavel nao declarada: ${target.name}.`);

  const type = getBindingType(binding);
  if (target.indexExpression != null) {
    if (!isVectorType(type)) throw new Error(`${target.name} nao foi declarado como vetor.`);
    setVectorValue(
      getBindingValue(binding),
      type,
      await evaluateIndexes(runtime, target.indexExpression),
      target.name,
      coerceValue(value, type.itemType)
    );
    return;
  }

  setBindingValue(binding, value);
}

export function coerceRuntimeInput(runtime, name, value) {
  const target = parseTarget(name);
  const binding = runtime.findBinding(normalizeName(target.name));
  if (!binding) throw new Error(`Variavel nao declarada: ${target.name}.`);

  const type = getBindingType(binding);
  return coerceValue(value, isVectorType(type) ? type.itemType : type);
}

export function getRuntimeVariableType(runtime, name) {
  const target = parseTarget(name);
  const binding = runtime.findBinding(normalizeName(target.name));
  if (!binding) return null;
  const type = getBindingType(binding);
  return isVectorType(type) ? type.itemType : type;
}

async function evaluateIndexes(runtime, indexExpression) {
  const indexes = [];
  for (const expression of parseIndexExpressions(indexExpression)) {
    indexes.push(Number(await runtime.evaluate(expression)));
  }
  return indexes;
}
