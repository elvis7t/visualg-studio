# ADR 0007 - Sessao de depuracao interativa

## Status

Aceita.

## Contexto

O projeto começou com uma API de depuração baseada em trace completo: o programa era executado inteiro com `debug: true` e a UI navegava por snapshots já gravados. Esse modelo era simples e útil para testes, mas não representava bem o comportamento esperado de uma IDE:

- `leia(...)` precisava receber entradas antes da execução.
- A UI não conseguia pausar de verdade antes do próximo comando.
- Breakpoints e continuidade tinham semântica limitada.
- Programas longos podiam gerar muitos snapshots antes de o usuário interagir.

## Decisao

A interface principal usa uma sessão interativa pausável (`createInteractiveDebugSession`). A cada passo, o interpretador emite um snapshot e aguarda a UI liberar a continuação. Isso permite:

- `Próximo` avançar sob demanda.
- `Continuar` executar até o próximo ponto de parada posterior ou até o fim.
- `leia(...)` pedir entrada no momento em que o comando é alcançado.
- O editor destacar a linha atual enquanto o painel mostra variáveis, tipos, inspeção e saída acumulada.

A API antiga (`createDebugSession`) foi mantida como modo headless/compatibilidade, implementada por `createHeadlessDebugSession`. Ela continua útil para testes, automações simples e fallback técnico, mas não é o fluxo principal do app.

## Consequencias

- A UI fica mais próxima de um depurador real.
- O protocolo interno de debug passa a depender de callbacks assíncronos.
- A migração para Worker deve preservar o mesmo contrato: pausar, retomar, receber entrada, emitir snapshots e navegar por breakpoints. Essa migração foi feita na ADR 0008, mantendo o executor direto apenas como fallback técnico.
- O modo headless permanece documentado para não parecer uma segunda implementação concorrente da UI.
