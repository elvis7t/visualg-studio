import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertLoopGuard,
  configureRandomMode,
  createExecutionState,
  nextInput
} from '../src/interpreter/execution-state.js';

test('execution state consumes queued input before interactive input', async () => {
  const reads = [];
  const state = createExecutionState({
    input: ['Ana'],
    async onRead(request) {
      reads.push(request.name);
      return 'Bia';
    }
  });

  assert.equal(await nextInput(state, { name: 'primeiro' }), 'Ana');
  assert.equal(await nextInput(state, { name: 'segundo' }), 'Bia');
  assert.deepEqual(reads, ['segundo']);
});

test('execution state uses aleatorio range for input and validates loop guard', async () => {
  const state = createExecutionState({ loopGuardLimit: 2 });
  await configureRandomMode(state, { mode: 'range', min: '4', max: '4' }, async (expression) => Number(expression));

  assert.equal(await nextInput(state, { name: 'n' }), '4');
  assert.doesNotThrow(() => assertLoopGuard(state, 2, 'enquanto'));
  assert.throws(() => assertLoopGuard(state, 3, 'enquanto'), /Loop enquanto excedeu o limite de seguranca/);
});
