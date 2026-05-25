import { normalizeName } from './scope-bindings.js';
import { normalizeKeyword } from './tokenizer.js';
import { defaultValue, defaultVector } from './vectors.js';

export function initializeDeclarations(declarations, scope) {
  for (const declaration of declarations) {
    const key = normalizeName(declaration.name);
    const type = normalizeKeyword(declaration.type);
    scope.types.set(key, declaration.vector ? { kind: 'vector', itemType: type, ...declaration.vector } : type);
    scope.values.set(key, declaration.vector ? defaultVector(declaration.vector, type) : defaultValue(type));
  }
}
