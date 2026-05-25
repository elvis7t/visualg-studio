# ADR 0002 - Interpretador Proprio em Node.js

## Status

Aceita.

## Contexto

A pasta original do Visualg 3.0.7 contém uma distribuição pronta com executável, ajuda e exemplos, mas não o código-fonte do interpretador. Para evoluir a compatibilidade e permitir depuração, era necessário controlar parser, runtime e estado de execução.

## Decisao

Implementar um interpretador proprio em JavaScript/Node.js, separado da UI.

## Consequencias

- O interpretador pode ser testado sem Electron.
- A depuração por etapa pode acessar snapshots de variáveis e saída.
- A compatibilidade com Visualg pode ser ampliada incrementalmente.
- Existem diferenças temporárias em relação ao Visualg original enquanto recursos faltantes são implementados.

## Regras Atuais

- Tipos desconhecidos são rejeitados.
- Vetores são inicializados com valores padrão.
- Preenchimento de sequência em vetor deve ser feito por laço, de forma compatível com Visualg.
- Erros de runtime devem incluir linha quando possível.
