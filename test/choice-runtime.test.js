import assert from 'node:assert/strict';
import test from 'node:test';

import { findSelectedChoiceCase } from '../src/interpreter/choice-runtime.js';

test('selects exact and range choice cases using runtime expression evaluation', async () => {
  const runtime = {
    async evaluate(expression) {
      if (expression === 'limite') return 5;
      return Number(expression);
    }
  };

  const cases = [
    { expressions: ['1'], statements: ['um'] },
    { expressions: ['2..limite'], statements: ['range'] },
    { expressions: ['9'], statements: ['nove'] }
  ];

  assert.deepEqual(await findSelectedChoiceCase(runtime, 1, cases), cases[0]);
  assert.deepEqual(await findSelectedChoiceCase(runtime, 4, cases), cases[1]);
  assert.equal(await findSelectedChoiceCase(runtime, 8, cases), null);
});
