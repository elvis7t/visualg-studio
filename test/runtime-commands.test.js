import assert from 'node:assert/strict';
import test from 'node:test';

import { createExecutionState } from '../src/interpreter/execution-state.js';
import { executeUtilityStatement } from '../src/interpreter/runtime-commands.js';

test('utility statements update runtime state without executing structured flow', async () => {
  const runtime = {
    output: ['linha antiga'],
    currentLine: 'parcial',
    echo: true,
    timerEnabled: false,
    timerStartedAt: null,
    executionState: createExecutionState(),
    async evaluate(expression) {
      return Number(expression);
    }
  };

  assert.equal(await executeUtilityStatement(runtime, { type: 'clearScreen' }), true);
  assert.deepEqual(runtime.output, []);
  assert.equal(runtime.currentLine, '');

  assert.equal(await executeUtilityStatement(runtime, { type: 'timer', mode: 'on' }), true);
  assert.equal(runtime.timerEnabled, true);
  assert.equal(typeof runtime.timerStartedAt, 'number');

  assert.equal(await executeUtilityStatement(runtime, { type: 'echo', mode: 'off' }), true);
  assert.equal(runtime.echo, false);

  assert.equal(await executeUtilityStatement(runtime, { type: 'randomMode', mode: 'range', min: '4', max: '4' }), true);
  assert.deepEqual(runtime.executionState.randomMode, { min: 4, max: 4 });

  assert.equal(await executeUtilityStatement(runtime, { type: 'assign' }), false);
});
