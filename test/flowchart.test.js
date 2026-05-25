import assert from "node:assert/strict";
import test from "node:test";
import { createFlowchart } from "../src/interpreter/flowchart.js";

test("gera fluxograma com entrada, decisao e saida", () => {
  const chart = createFlowchart(`
algoritmo "Fluxo"
var
  idade: inteiro
inicio
  leia(idade)
  se idade >= 18 entao
    escreval("Maior")
  senao
    escreval("Menor")
  fimse
fimalgoritmo
`);

  assert.equal(chart.nodes[0].kind, "terminal");
  assert.equal(chart.nodes.at(-1).label, "Fim");
  assert.ok(chart.nodes.some((node) => node.kind === "input" && node.label === "leia(idade)"));
  assert.ok(chart.nodes.some((node) => node.kind === "decision" && node.label === "idade >= 18?"));
  assert.ok(chart.edges.some((edge) => edge.label === "sim"));
  assert.ok(chart.edges.some((edge) => edge.label === "nao"));

  const decisionIndex = chart.nodes.findIndex((node) => node.kind === "decision");
  const thenIndex = chart.nodes.findIndex((node) => node.label === 'escreval("Maior")');
  const joinIndex = chart.nodes.findIndex((node) => node.label === "fimse");
  assert.ok(decisionIndex < thenIndex);
  assert.ok(thenIndex < joinIndex);
});

test("gera fluxograma com laço para e atribuicao", () => {
  const chart = createFlowchart(`
algoritmo "Laco"
var
  i: inteiro
inicio
  para i de 1 ate 3 faca
    i <- i + 1
  fimpara
fimalgoritmo
`);

  assert.ok(chart.nodes.some((node) => node.kind === "loop" && node.label === "para i de 1 ate 3"));
  assert.ok(chart.nodes.some((node) => node.kind === "process" && node.label === "i <- i + 1"));

  const loopIndex = chart.nodes.findIndex((node) => node.kind === "loop");
  const bodyIndex = chart.nodes.findIndex((node) => node.label === "i <- i + 1");
  const joinIndex = chart.nodes.findIndex((node) => node.label === "fimpara");
  assert.ok(loopIndex < bodyIndex);
  assert.ok(bodyIndex < joinIndex);
});
