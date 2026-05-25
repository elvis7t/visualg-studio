import test from 'node:test';
import assert from 'node:assert/strict';
import { collectDeclaredVariables, getVisualgCompletionOptions } from '../src/renderer/visualg-completion.js';

test('collects variables declared in Visualg var block', () => {
  const variables = collectDeclaredVariables(`
algoritmo "Teste"
var
  nome: caracter
  nota1, nota2, media: real
  notas: vetor[1..3] de inteiro
inicio
fimalgoritmo
`);

  assert.deepEqual(variables, ['nome', 'nota1', 'nota2', 'media', 'notas']);
});

test('builds autocomplete options with keywords and variables', () => {
  const options = getVisualgCompletionOptions(`
algoritmo "Teste"
var
  nome: caracter
inicio
fimalgoritmo
`);

  assert.ok(options.some((option) => option.label === 'leia' && option.type === 'keyword'));
  assert.ok(options.some((option) => option.label === 'nome' && option.type === 'variable'));
});
