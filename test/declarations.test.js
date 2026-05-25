import assert from 'node:assert/strict';
import test from 'node:test';

import { initializeDeclarations } from '../src/interpreter/declarations.js';
import { createScope } from '../src/interpreter/scope-bindings.js';

test('initializes scalar and vector declarations into a runtime scope', () => {
  const scope = createScope();

  initializeDeclarations([
    { name: 'Nome', type: 'Caracter' },
    { name: 'notas', type: 'Inteiro', vector: { start: 1, end: 2 } }
  ], scope);

  assert.equal(scope.values.get('nome'), '');
  assert.equal(scope.types.get('nome'), 'caracter');
  assert.deepEqual(scope.values.get('notas').slice(1), [0, 0]);
  assert.deepEqual(scope.types.get('notas'), {
    kind: 'vector',
    itemType: 'inteiro',
    start: 1,
    end: 2
  });
});
