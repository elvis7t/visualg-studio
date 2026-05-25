import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeVisualgMetrics } from '../src/interpreter/index.js';

test('calculates basic cyclomatic complexity for branches and choices', () => {
  const metrics = analyzeVisualgMetrics(`
algoritmo "Metricas"
var
  x: inteiro
inicio
  se x > 0 entao
    escreval("positivo")
  senao
    escreval("zero")
  fimse
  escolha x
    caso 1
      escreval("um")
    caso 2
      escreval("dois")
    outrocaso
      escreval("outro")
  fimescolha
fimalgoritmo
`);

  assert.equal(metrics.cyclomaticComplexity, 4);
  assert.equal(metrics.bigO.value, '~O(1)');
  assert.equal(metrics.bigO.source, 'estimated');
});

test('estimates Big O from loop nesting depth', () => {
  const metrics = analyzeVisualgMetrics(`
algoritmo "Lacos"
var
  i, j: inteiro
inicio
  para i de 1 ate 10 faca
    para j de 1 ate 10 faca
      escreval(i, j)
    fimpara
  fimpara
fimalgoritmo
`);

  assert.equal(metrics.cyclomaticComplexity, 3);
  assert.equal(metrics.bigO.value, '~O(n²)');
  assert.equal(metrics.bigO.maxLoopDepth, 2);
});

test('uses student complexity annotation when present', () => {
  const metrics = analyzeVisualgMetrics(`
// @complexidade O(log n)
algoritmo "Busca"
inicio
  escreval("ok")
fimalgoritmo
`);

  assert.equal(metrics.bigO.value, 'O(log n)');
  assert.equal(metrics.bigO.source, 'annotation');
});

test('marks simple recursive subprograms in Big O estimate', () => {
  const metrics = analyzeVisualgMetrics(`
algoritmo "Recursivo"
inicio
  escreval(fatorial(3))
fimalgoritmo

funcao fatorial(n: inteiro): inteiro
inicio
  se n <= 1 entao
    retorne 1
  fimse
  retorne n * fatorial(n - 1)
fimfuncao
`);

  assert.equal(metrics.bigO.value, '~O(2^n)');
  assert.equal(metrics.bigO.recursive, true);
  assert.deepEqual(metrics.bigO.recursiveSubprograms, ['fatorial']);
});
