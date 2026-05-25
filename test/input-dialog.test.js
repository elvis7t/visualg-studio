import test from 'node:test';
import assert from 'node:assert/strict';
import { getFallbackValues } from '../src/renderer/input-dialog.js';

test('keeps leia fallback values separated by lines', () => {
  assert.deepEqual(getFallbackValues({ value: 'Mat\n12' }), ['Mat', '12']);
});

test('also accepts pipe separated leia fallback values', () => {
  assert.deepEqual(getFallbackValues({ value: 'Mat | 12' }), ['Mat', '12']);
});
