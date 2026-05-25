# Runtime Refactor Design

## Objetivo

Reduzir o tamanho e o acoplamento de `src/interpreter/runtime.js` antes de implementar entrada interativa real.

Esta etapa nao muda a linguagem, a UI ou a API publica do interpretador. O comportamento esperado deve continuar coberto pela suite atual.

## Escopo

- Extrair o parser/avaliador de expressoes para `src/interpreter/expressions.js`.
- Extrair helpers de vetores para `src/interpreter/vectors.js`.
- Manter `runtime.js` como orquestrador da execucao de comandos.
- Preservar `runVisualg`, `debugVisualg`, `createDebugSession` e `evaluateWatchExpression`.

## Fora de Escopo

- Entrada interativa real durante execucao.
- Debugger pausavel real.
- Step-into/step-out em subprogramas.
- Mudancas visuais no renderer.

## Validacao

- Rodar `npm run build:renderer` se algum import usado pelo renderer for afetado.
- Rodar `npm run verify`.
- A suite deve continuar passando sem alteracao de snapshot ou comportamento.
