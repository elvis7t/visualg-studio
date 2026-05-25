import assert from 'node:assert/strict';
import test from 'node:test';

import { BUILTINS } from '../src/interpreter/lexicon.js';
import {
  callNativeFunction,
  nativeFunctionNames
} from '../src/interpreter/native-functions.js';

test('native function table stays in sync with the Visualg builtin lexicon', () => {
  assert.deepEqual(nativeFunctionNames().sort(), [...BUILTINS].sort());
});

test('native function table validates arity and dispatches handlers', () => {
  assert.equal(callNativeFunction('quad', [4]), 16);
  assert.equal(callNativeFunction('copia', ['abcdef', 2, 3]), 'bcd');
  assert.throws(() => callNativeFunction('abs', [1, 2]), /Funcao abs esperava 1 argumento, recebeu 2\./);
});
