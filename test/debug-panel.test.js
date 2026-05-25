import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDebugPhase } from '../src/renderer/debug-panel.js';

test('formats debug phases for the Portuguese interface', () => {
  assert.equal(formatDebugPhase('before'), 'antes');
  assert.equal(formatDebugPhase('after'), 'depois');
  assert.equal(formatDebugPhase('custom'), 'custom');
});
