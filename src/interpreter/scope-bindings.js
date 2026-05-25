import { normalizeKeyword } from './tokenizer.js';
import {
  coerceValue,
  getVectorValue,
  isVectorType,
  setVectorValue,
  snapshotVector
} from './vectors.js';

export function createScope() {
  return { values: new Map(), types: new Map(), aliases: new Map() };
}

export function normalizeName(name) {
  return normalizeKeyword(name.trim());
}

export function parameterType(param) {
  const type = normalizeKeyword(param.type);
  return param.vector ? { kind: 'vector', itemType: type, ...param.vector } : type;
}

export function getBindingType(binding) {
  const type = binding.scope.types.get(binding.key);
  return binding.indexes ? type.itemType : type;
}

export function getBindingValue(binding) {
  const type = binding.scope.types.get(binding.key);
  const value = binding.scope.values.get(binding.key);
  return binding.indexes ? getVectorValue(value, type, binding.indexes, binding.key) : value;
}

export function setBindingValue(binding, value) {
  const type = binding.scope.types.get(binding.key);
  if (binding.indexes) {
    setVectorValue(binding.scope.values.get(binding.key), type, binding.indexes, binding.key, coerceValue(value, type.itemType));
    return;
  }
  binding.scope.values.set(binding.key, coerceValue(value, type));
}

export function snapshotBindingValue(value, type) {
  return isVectorType(type) ? snapshotVector(value, type) : value;
}
