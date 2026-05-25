# ADR 0006: Persistência de Configurações em LocalStorage

## Status

Aceita.

## Contexto

As configurações do renderer são preferências locais de interface: tema, layout dos painéis, fontes, tamanhos, quebra de linha, guias de indentação e visibilidade do painel de depuração. Hoje elas são gravadas diretamente em `localStorage` com chaves estáveis.

## Decisão

Manter `localStorage` para preferências simples do renderer, sem versionamento de schema nesta fase.

## Consequências

- A persistência é simples, local e suficiente para preferências de UI.
- Não há dependência do processo main nem de arquivos externos para carregar a interface.
- Mudanças futuras incompatíveis podem exigir migração ou limpeza manual das chaves antigas.
- Se as configurações ganharem estrutura mais complexa, deve ser criada uma chave versionada, por exemplo `visualg-settings-v2`, com migração explícita.
