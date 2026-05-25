import assert from 'node:assert/strict';
import test from 'node:test';

import { findBreakpointIndexes } from '../src/interpreter/debug-session.js';

test('maps breakpoint lines to first matching debug step indexes without duplicates', () => {
  const steps = [
    { line: 2 },
    { line: 5 },
    { line: 5 },
    { line: 8 }
  ];

  assert.deepEqual(findBreakpointIndexes(steps, [5, 6, 5, 99]), [1, 3]);
  assert.deepEqual(findBreakpointIndexes(steps, []), []);
});
