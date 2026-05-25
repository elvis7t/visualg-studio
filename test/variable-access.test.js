import assert from 'node:assert/strict';
import test from 'node:test';

import { createScope } from '../src/interpreter/scope-bindings.js';
import { defaultVector } from '../src/interpreter/vectors.js';
import {
  coerceRuntimeInput,
  getRuntimeValue,
  setRuntimeValue
} from '../src/interpreter/variable-access.js';

function createRuntimeFixture() {
  const scope = createScope();
  const vectorType = { kind: 'vector', itemType: 'inteiro', start: 1, end: 3 };

  scope.types.set('nome', 'caracter');
  scope.values.set('nome', 'Ana');
  scope.types.set('notas', vectorType);
  scope.values.set('notas', defaultVector(vectorType, 'inteiro'));

  return {
    async evaluate(expression) {
      return Number(expression);
    },
    findBinding(key) {
      return scope.values.has(key) ? { scope, key } : null;
    },
    scope
  };
}

test('variable access reads and writes scalar values through runtime bindings', async () => {
  const runtime = createRuntimeFixture();

  assert.equal(await getRuntimeValue(runtime, 'nome'), 'Ana');
  await setRuntimeValue(runtime, 'nome', 'Bia');

  assert.equal(await getRuntimeValue(runtime, 'nome'), 'Bia');
});

test('variable access reads and writes vector positions through evaluated indexes', async () => {
  const runtime = createRuntimeFixture();

  await setRuntimeValue(runtime, 'notas[2]', '7');

  assert.equal(await getRuntimeValue(runtime, 'notas', '2'), 7);
  assert.equal(coerceRuntimeInput(runtime, 'notas[1]', '8'), 8);
});

test('variable access preserves runtime errors for missing variables and invalid indexes', async () => {
  const runtime = createRuntimeFixture();

  await assert.rejects(() => getRuntimeValue(runtime, 'idade'), /Variavel nao declarada: idade\./);
  await assert.rejects(() => getRuntimeValue(runtime, 'notas'), /notas precisa de indice\./);
  await assert.rejects(() => setRuntimeValue(runtime, 'nome[1]', 'x'), /nome nao foi declarado como vetor\./);
});
