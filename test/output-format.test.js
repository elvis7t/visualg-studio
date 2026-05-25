import assert from 'node:assert/strict';
import test from 'node:test';

import { formatWriteArgument } from '../src/interpreter/output-format.js';

test('formats write arguments with Visualg width and decimals syntax', async () => {
  const runtime = {
    async evaluate(expression) {
      if (expression === 'valor') return 12.345;
      if (expression === 'flag') return true;
      return expression;
    }
  };

  assert.equal(await formatWriteArgument('valor:8:2', runtime), '   12.35');
  assert.equal(await formatWriteArgument('flag', runtime), 'verdadeiro');
});
