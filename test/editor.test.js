import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditorController, getCursorPosition } from '../src/renderer/editor-controller.js';

test('calculates one-based cursor line and column', () => {
  assert.deepEqual(getCursorPosition('linha 1\nlinha 2', 9), { line: 2, column: 2 });
});

test('maps Visualg editor shortcuts to actions', () => {
  const calls = [];
  const controller = createEditorController({
    status: { textContent: '' },
    actions: {
      save: () => calls.push('save'),
      run: () => calls.push('run'),
      debug: () => calls.push('debug'),
      indent: () => calls.push('indent'),
      find: () => calls.push('find'),
      replace: () => calls.push('replace')
    }
  });
  const keymap = controller.keymap();

  assert.equal(keymap.find((item) => item.key === 'F9').run(), true);
  assert.equal(keymap.find((item) => item.key === 'F5').run(), true);
  assert.equal(keymap.find((item) => item.key === 'Alt-Shift-f').run(), true);
  assert.deepEqual(calls, ['run', 'debug', 'indent']);
});
