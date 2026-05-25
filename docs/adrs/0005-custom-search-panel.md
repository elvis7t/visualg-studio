# ADR 0005: Painel Próprio de Busca e Substituição

## Status

Aceita.

## Contexto

O editor usa CodeMirror 6 e poderia adotar `@codemirror/search` para busca e substituição. O projeto, porém, já possui uma barra de busca própria integrada ao layout, aos botões da interface e aos atalhos do VisuAlg Studio.

## Decisão

Manter o painel próprio de busca/substituição enquanto ele continuar cobrindo o fluxo esperado:

- `Ctrl+F` para buscar.
- `Ctrl+H` para buscar e substituir.
- Navegação anterior/próxima.
- Substituir ocorrência atual.
- Substituir todas.
- Opção de diferenciar maiúsculas/minúsculas.

## Consequências

- A UI permanece visualmente consistente com o restante do aplicativo.
- O comportamento fica sob controle do projeto, sem depender da UI padrão do pacote de busca.
- Recursos avançados de `@codemirror/search`, como regex e integração nativa de painéis, ficam fora do escopo até haver necessidade real.
- Se a busca crescer em complexidade, a decisão deve ser reavaliada antes de duplicar funcionalidades que o CodeMirror já entrega.
