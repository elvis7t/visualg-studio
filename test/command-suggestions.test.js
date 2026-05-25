import assert from 'node:assert/strict';
import test from 'node:test';

import {
  levenshteinDistance,
  suggestCommand
} from '../src/interpreter/command-suggestions.js';

test('suggests close Visualg command and builtin names', () => {
  assert.equal(suggestCommand('escrev'), ' Voce quis dizer "escreva"?');
  assert.equal(suggestCommand('raiz'), ' Voce quis dizer "raizq"?');
  assert.equal(suggestCommand('comando-totalmente-invalido'), '');
});

test('calculates levenshtein distance for command suggestions', () => {
  assert.equal(levenshteinDistance('interonpa', 'interrompa'), 2);
  assert.equal(levenshteinDistance('abc', 'abc'), 0);
});
