import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVisualg } from '../src/interpreter/parser.js';
import { listExampleNames, readExample } from '../src/main/examples.js';

test('lists bundled Visualg examples', async () => {
  const names = await listExampleNames();

  assert.ok(names.includes('entrada.alg'));
  assert.ok(names.includes('basicos/primeiro-programa.alg'));
  assert.ok(names.includes('funcoes-nativas/trigonometria-e-conversoes.alg'));
  assert.ok(names.includes('controle/numero-aleatorio.alg'));
  assert.ok(names.includes('controle/utilitarios.alg'));
  assert.ok(names.includes('subprogramas/media-com-funcao.alg'));
  assert.ok(names.includes('vetores/busca-binaria.alg'));
  assert.ok(names.includes('subprogramas/ordenacao-com-troca.alg'));
});

test('reads categorized bundled Visualg examples', async () => {
  const content = await readExample('subprogramas/fatorial-recursivo.alg');

  assert.match(content, /funcao fatorial/);
});

test('parses every bundled Visualg example', async () => {
  const names = await listExampleNames();

  for (const name of names) {
    const content = await readExample(name);
    assert.doesNotThrow(() => parseVisualg(content), name);
  }
});
