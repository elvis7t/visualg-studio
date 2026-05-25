import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCodePrintHtml,
  defaultCodeFileName,
} from "../src/main/code-output.js";

test("gera HTML de impressao escapando codigo e titulo", () => {
  const html = buildCodePrintHtml({
    title: 'Busca <script>alert("x")</script>',
    content: 'escreval("1 < 2")\n// comentario',
  });

  assert.match(html, /Busca &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /escreval\(&quot;1 &lt; 2&quot;\)/);
  assert.match(html, /Imprimir/);
  assert.match(html, /@media print/);
  assert.match(html, /white-space: pre-wrap/);
  assert.doesNotMatch(html, /<script>/);
});

test("normaliza nome padrao de exportacao de codigo", () => {
  assert.equal(defaultCodeFileName("BuscaBinaria"), "BuscaBinaria.alg");
  assert.equal(defaultCodeFileName("media-simples.alg"), "media-simples.alg");
  assert.equal(defaultCodeFileName(""), "algoritmo.alg");
});
