import { normalizeKeyword, splitArguments } from './tokenizer.js';

export function defaultValue(type) {
  if (type === 'inteiro' || type === 'real') return 0;
  if (type === 'logico') return false;
  return '';
}

export function defaultVector(vector, itemType) {
  if (vector.dimensions?.length > 1) return defaultVectorDimensions(vector.dimensions, itemType);

  const values = [];
  for (let index = vector.start; index <= vector.end; index += 1) {
    values[index] = defaultValue(itemType);
  }
  return values;
}

export function coerceValue(value, type) {
  if (isVectorType(type)) return value;
  if (type === 'inteiro') {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`Valor invalido para inteiro: ${value}.`);
    return Math.trunc(number);
  }
  if (type === 'real') {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`Valor invalido para real: ${value}.`);
    return number;
  }
  if (type === 'logico') {
    if (typeof value === 'boolean') return value;
    const normalized = normalizeKeyword(String(value));
    if (['verdadeiro', 'true', '1'].includes(normalized)) return true;
    if (['falso', 'false', '0'].includes(normalized)) return false;
    throw new Error(`Valor invalido para logico: ${value}.`);
  }
  return value == null ? '' : String(value);
}

export function isVectorType(type) {
  return typeof type === 'object' && type?.kind === 'vector';
}

export function formatType(type) {
  if (!isVectorType(type)) return type;
  const dimensions = vectorDimensions(type).map((dimension) => `${dimension.start}..${dimension.end}`).join(', ');
  return `vetor[${dimensions}] de ${type.itemType}`;
}

export function sameType(left, right) {
  if (isVectorType(left) || isVectorType(right)) return sameVectorType(left, right);
  return left === right;
}

export function parseTarget(target) {
  const match = String(target).match(/^([a-zA-Z_][\w]*)\s*(?:\[(.+)\])?$/);
  if (!match) throw new Error(`Alvo invalido: ${target}`);
  return { name: match[1], indexExpression: match[2]?.trim() };
}

export function parseIndexExpressions(indexExpression) {
  return splitArguments(indexExpression);
}

export function getVectorValue(vector, type, indexes, name) {
  const dimensions = vectorDimensions(type);
  if (indexes.length !== dimensions.length) {
    throw new Error(`${name} esperava ${dimensions.length} indice(s), recebeu ${indexes.length}.`);
  }

  let value = vector;
  for (let i = 0; i < indexes.length; i += 1) {
    const index = indexes[i];
    const dimension = dimensions[i];
    assertIndexInRange(name, index, dimension);
    value = value[index];
  }
  return value;
}

export function setVectorValue(vector, type, indexes, name, value) {
  const dimensions = vectorDimensions(type);
  if (indexes.length !== dimensions.length) {
    throw new Error(`${name} esperava ${dimensions.length} indice(s), recebeu ${indexes.length}.`);
  }

  let target = vector;
  for (let i = 0; i < indexes.length - 1; i += 1) {
    const index = indexes[i];
    const dimension = dimensions[i];
    assertIndexInRange(name, index, dimension);
    target = target[index];
  }

  const lastIndex = indexes.at(-1);
  assertIndexInRange(name, lastIndex, dimensions.at(-1));
  target[lastIndex] = value;
}

export function snapshotVector(vector, type) {
  return flattenVector(vector, vectorDimensions(type), 0);
}

function defaultVectorDimensions(dimensions, itemType) {
  const [dimension, ...remaining] = dimensions;
  const values = [];
  for (let index = dimension.start; index <= dimension.end; index += 1) {
    values[index] = remaining.length ? defaultVectorDimensions(remaining, itemType) : defaultValue(itemType);
  }
  return values;
}

function vectorDimensions(type) {
  return type.dimensions ?? [{ start: type.start, end: type.end }];
}

function sameVectorType(left, right) {
  if (!isVectorType(left) || !isVectorType(right)) return false;
  if (left.itemType !== right.itemType) return false;
  const leftDimensions = vectorDimensions(left);
  const rightDimensions = vectorDimensions(right);
  if (leftDimensions.length !== rightDimensions.length) return false;
  return leftDimensions.every((dimension, index) => (
    dimension.start === rightDimensions[index].start && dimension.end === rightDimensions[index].end
  ));
}

function flattenVector(value, dimensions, depth) {
  const dimension = dimensions[depth];
  const result = {};

  for (let index = dimension.start; index <= dimension.end; index += 1) {
    const key = String(index);
    result[key] = depth === dimensions.length - 1
      ? value[index]
      : flattenVector(value[index], dimensions, depth + 1);
  }

  return result;
}

function assertIndexInRange(name, index, dimension) {
  if (index < dimension.start || index > dimension.end) {
    throw new Error(`Indice ${index} fora do intervalo de ${name}[${dimension.start}..${dimension.end}].`);
  }
}
