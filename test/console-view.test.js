import test from 'node:test';
import assert from 'node:assert/strict';
import { createConsoleView } from '../src/renderer/console-view.js';

test('clears console output without clearing debug panel', () => {
  let debugCleared = false;
  const output = {
    textContent: 'saida',
    classList: {
      add() {},
      remove() {},
      toggle() {}
    }
  };
  const consoleView = createConsoleView({
    output,
    debug: {
      clear() {
        debugCleared = true;
      }
    }
  });

  consoleView.clear();

  assert.equal(output.textContent, 'Saída do programa aparecerá aqui...');
  assert.equal(debugCleared, false);
});
