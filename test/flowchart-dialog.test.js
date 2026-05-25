import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFlowchartFitTransform,
  createExportableFlowchartSvg,
  layoutFlowchartNodes,
  renderFlowchartSvg,
} from "../src/renderer/flowchart-dialog.js";
import { createFlowchart } from "../src/interpreter/flowchart.js";

const chart = {
  nodes: [
    { id: "n1", kind: "terminal", label: "Início" },
    { id: "n2", kind: "output", label: 'escreval("<ok>")' },
  ],
  edges: [{ from: "n1", to: "n2", label: "" }],
};

test("renderiza fluxograma em SVG escapando textos", () => {
  const svg = renderFlowchartSvg(chart);

  assert.match(svg, /<svg/);
  assert.match(svg, /escreval\(&quot;&lt;ok&gt;&quot;\)/);
  assert.match(svg, /marker-end/);
});

test("gera SVG exportavel com namespace e estilos embutidos", () => {
  const svg = createExportableFlowchartSvg(chart);

  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<style>/);
  assert.match(svg, /flowchart-export-bg/);
  assert.match(svg, /escreval\(&quot;&lt;ok&gt;&quot;\)/);
});

test("posiciona ramos de decisao em colunas diferentes", () => {
  const layout = layoutFlowchartNodes({
    nodes: [
      { id: "n1", kind: "terminal", label: "Início" },
      { id: "n2", kind: "decision", label: "idade >= 18?" },
      { id: "n3", kind: "output", label: "Maior" },
      { id: "n4", kind: "join", label: "fimse" },
      { id: "n5", kind: "output", label: "Menor" },
      { id: "n6", kind: "terminal", label: "Fim" },
    ],
    edges: [
      { from: "n1", to: "n2", label: "" },
      { from: "n2", to: "n3", label: "sim" },
      { from: "n3", to: "n4", label: "" },
      { from: "n2", to: "n5", label: "nao" },
      { from: "n5", to: "n4", label: "" },
      { from: "n4", to: "n6", label: "" },
    ],
  });

  assert.equal(layout.positions.get("n2").x, layout.positions.get("n4").x);
  assert.ok(layout.positions.get("n3").x < layout.positions.get("n2").x);
  assert.ok(layout.positions.get("n5").x > layout.positions.get("n2").x);
  assert.ok(layout.width > 920);
});

test("mantem fluxograma complexo dentro do viewBox", () => {
  const chart = createFlowchart(`
algoritmo "Busca"
var
  notas: vetor[1..10] de inteiro
  baixo, alto, meio, chute, item: inteiro
inicio
  notas[1] <- 10
  baixo <- 1
  alto <- 10
  item <- 7
  enquanto baixo <= alto faca
    meio <- (baixo + alto) div 2
    chute <- notas[meio]
    escreval("chute: ", chute)
    se chute = item entao
      escreval("ENCONTROU O ITEM!")
      interrompa
    fimse
    se chute > item entao
      escreval("Procurando na esquerda")
      alto <- meio - 1
    senao
      escreval("Procurando na direita")
      baixo <- meio + 1
    fimse
  fimenquanto
fimalgoritmo
`);
  const layout = layoutFlowchartNodes(chart);

  for (const position of layout.positions.values()) {
    assert.ok(position.x - position.width / 2 >= 0);
    assert.ok(position.x + position.width / 2 <= layout.width);
  }
});

test("calcula ajuste do fluxograma para caber na area visivel", () => {
  const transform = calculateFlowchartFitTransform({
    viewportWidth: 800,
    viewportHeight: 420,
    contentWidth: 1600,
    contentHeight: 800,
    padding: 24,
  });

  assert.equal(transform.zoom, 0.465);
  assert.equal(transform.panX, 28);
  assert.equal(transform.panY, 24);
});

test("nao amplia fluxogramas menores ao ajustar para a tela", () => {
  const transform = calculateFlowchartFitTransform({
    viewportWidth: 1000,
    viewportHeight: 700,
    contentWidth: 500,
    contentHeight: 300,
    padding: 24,
  });

  assert.equal(transform.zoom, 1);
  assert.equal(transform.panX, 250);
  assert.equal(transform.panY, 200);
});
