import assert from 'node:assert/strict';
import test from 'node:test';

import { createScope } from '../src/interpreter/scope-bindings.js';
import { defaultVector } from '../src/interpreter/vectors.js';
import {
  snapshotRuntimeVariableTypes,
  snapshotRuntimeVariables
} from '../src/interpreter/runtime-snapshot.js';

test('runtime snapshots include scoped values, vector values and aliases', () => {
  const globalScope = createScope();
  const localScope = createScope();
  const vectorType = { kind: 'vector', itemType: 'inteiro', start: 1, end: 2 };

  globalScope.types.set('contador', 'inteiro');
  globalScope.values.set('contador', 3);
  globalScope.types.set('notas', vectorType);
  globalScope.values.set('notas', defaultVector(vectorType, 'inteiro'));
  globalScope.values.get('notas')[1] = 8;
  globalScope.values.get('notas')[2] = 9;

  localScope.aliases.set('referencia', { scope: globalScope, key: 'contador' });

  const runtime = { scopes: [globalScope, localScope] };

  assert.deepEqual(snapshotRuntimeVariables(runtime), {
    contador: 3,
    notas: { 1: 8, 2: 9 },
    referencia: 3
  });
  assert.deepEqual(snapshotRuntimeVariableTypes(runtime), {
    contador: 'inteiro',
    notas: 'vetor[1..2] de inteiro',
    referencia: 'inteiro'
  });
});
