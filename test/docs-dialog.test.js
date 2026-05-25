import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCS_TABS } from '../src/renderer/docs-dialog.js';

test('documents editor shortcuts and practical tips in dedicated tabs', () => {
  const tabTitles = DOCS_TABS.map((tab) => tab.title);

  assert.ok(tabTitles.includes('Atalhos'));
  assert.ok(tabTitles.includes('Dicas'));

  const shortcuts = DOCS_TABS.find((tab) => tab.title === 'Atalhos');
  assert.match(shortcuts.sections.map((section) => section.text).join('\n'), /Ctrl\+F/);
  assert.match(shortcuts.sections.map((section) => section.text).join('\n'), /Ctrl\+H/);
  assert.match(shortcuts.sections.map((section) => section.text).join('\n'), /substituir/i);

  const tips = DOCS_TABS.find((tab) => tab.title === 'Dicas');
  assert.match(tips.sections.map((section) => section.text).join('\n'), /entrada por linha/i);
  assert.match(tips.sections.map((section) => section.text).join('\n'), /vetor/i);
});
