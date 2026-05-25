# ADR 0001 - Electron como Shell Desktop

## Status

Aceita.

## Contexto

O objetivo do VisuAlg Studio e entregar uma aplicação desktop para Windows, com interface moderna, acesso a arquivos locais, instalador e experiência semelhante a uma IDE. A aplicação precisa rodar localmente e ser distribuída como executável/instalador.

## Decisao

Usar Electron como shell desktop.

## Consequencias

- O app pode ser executado com `npm start`.
- O mesmo código de UI roda no renderer usando HTML, CSS e JavaScript.
- O processo main controla janela, dialogs e integração com sistema operacional.
- A distribuição Windows pode ser feita com `electron-builder`.
- O pacote final fica maior que uma aplicação nativa, mas o ganho de velocidade de desenvolvimento compensa neste estágio.

## Alternativas Consideradas

- Tauri: menor tamanho final, mas exigiria Rust e outra cadeia de build.
- Aplicação web pura: mais simples, mas não entregaria instalador desktop nativo.
- Aplicação nativa Windows: maior custo de implementação e menor reaproveitamento do ecossistema Node.
