import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVisualg } from '../src/interpreter/formatter.js';

test('formats Visualg block indentation', () => {
  const source = `
algoritmo "Indentar"
var
x: inteiro
inicio
se x > 0 entao
escreval(x)
senao
escreval("zero")
fimse
fimalgoritmo
`;

  assert.equal(formatVisualg(source), [
    'algoritmo "Indentar"',
    'var',
    '  x: inteiro',
    'inicio',
    '  se x > 0 entao',
    '    escreval(x)',
    '  senao',
    '    escreval("zero")',
    '  fimse',
    'fimalgoritmo'
  ].join('\n'));
});

test('formats choices and subprograms with configured tab size', () => {
  const source = `
algoritmo "Sub"
funcao dobro(x: inteiro): inteiro
inicio
retorne x * 2
fimfuncao
inicio
escolha dobro(1)
caso 2
escreval("dois")
outrocaso
escreval("outro")
fimescolha
fimalgoritmo
`;

  assert.equal(formatVisualg(source, { tabSize: 4 }), [
    'algoritmo "Sub"',
    'funcao dobro(x: inteiro): inteiro',
    'inicio',
    '    retorne x * 2',
    'fimfuncao',
    'inicio',
    '    escolha dobro(1)',
    '        caso 2',
    '            escreval("dois")',
    '        outrocaso',
    '            escreval("outro")',
    '    fimescolha',
    'fimalgoritmo'
  ].join('\n'));
});

test('preserves comments while formatting', () => {
  const source = `
Algoritmo "Comentarios"
// Disciplina: Algoritmos
Var
nome: caracter // nome do aluno
Inicio
// Seção de Comandos
escreval("http://visualg.dev") // url dentro de string nao quebra
fimalgoritmo
`;

  assert.equal(formatVisualg(source), [
    'Algoritmo "Comentarios"',
    '// Disciplina: Algoritmos',
    'Var',
    '  nome: caracter // nome do aluno',
    'Inicio',
    '  // Seção de Comandos',
    '  escreval("http://visualg.dev") // url dentro de string nao quebra',
    'fimalgoritmo'
  ].join('\n'));
});
