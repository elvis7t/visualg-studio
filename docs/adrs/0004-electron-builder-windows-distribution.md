# ADR 0004 - Electron Builder para Distribuicao Windows

## Status

Aceita.

## Contexto

O projeto precisa gerar um executável e um instalador Windows, similar a aplicações desktop como VS Code e outros apps Electron.

## Decisao

Usar `electron-builder` para gerar:

- build unpacked em `dist/win-unpacked`;
- instalador NSIS em `dist`.

## Consequencias

- O comando `npm run pack:win` gera uma pasta executável para testes rápidos.
- O comando `npm run dist:win` gera instalador `.exe`.
- Ícone do app, instalador e desinstalador são configurados em `package.json`.
- A pasta `resources` precisa ser incluída no pacote para carregar a identidade visual.
