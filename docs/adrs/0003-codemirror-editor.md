# ADR 0003 - CodeMirror 6 como Editor

## Status

Aceita.

## Contexto

O primeiro editor era um `textarea`, suficiente para edição básica, mas limitado para uma IDE. O projeto precisava de numeração de linhas, autocomplete, syntax highlight, atalhos e melhor base para destacar linhas durante depuração.

## Decisao

Usar CodeMirror 6 como editor no renderer.

## Consequencias

- Há numeração de linhas e linha ativa.
- Há autocomplete de palavras-chave Visualg e variáveis declaradas.
- Há syntax highlight customizado.
- O renderer precisa ser empacotado com `esbuild`, porque imports de pacotes não funcionam diretamente via `file://` no Electron.
- Os comandos `npm start`, `npm run pack:win` e `npm run dist:win` executam `build:renderer` antes de abrir ou empacotar.

## Alternativas Consideradas

- Manter `textarea`: simples, mas insuficiente para recursos de IDE.
- Monaco Editor: mais próximo do VS Code, mas mais pesado e com integração inicial mais trabalhosa.
