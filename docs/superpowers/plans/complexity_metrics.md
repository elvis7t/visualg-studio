# Plano de Implementação: Métricas de Complexidade (Ciclomática e Big O)

Este plano descreve o design e as alterações necessárias para adicionar suporte a métricas de **Complexidade Ciclomática** e **Classificação Big O Estimada** no **VisuAlg Studio**, incluindo integração com o painel de configurações e realce visual dos laços no fluxograma da aplicação.

---

## Revisão Necessária (User Review)

> [!IMPORTANT]
> **Heurística e Risco Pedagógico do Big O**:
> Conforme discutido, a estimativa do Big O é aproximada (com base no aninhamento de laços e recursão simples) e pode ter imprecisões em lógicas de controle complexas baseadas em variáveis de entrada dinâmica.
>
> * Rotularemos a métrica de Big O como **"Estimada (~O)"**.
> * Adicionaremos suporte para anotação manual com o comentário `// @complexidade <valor>` (ex: `// @complexidade O(log n)`). Se detectado, o valor anotado substituirá a estimativa automática na interface, incentivando o aluno a calcular e documentar por conta própria.

> [!TIP]
> **Integração Visual no Fluxograma**:
> Para evitar "números mágicos", quando o usuário abrir o fluxograma, os laços que geram complexidade (ninhos de loops) serão marcados visualmente (ex: cor diferenciada nas bordas/formas ou um badge no nó do fluxograma correspondente), acompanhados por uma legenda no cabeçalho do diálogo explicando a estimativa.

---

## Perguntas em Aberto

> [!NOTE]
> * **Operadores Lógicos no Cálculo Ciclomático**: No cálculo padrão da complexidade ciclomática, operadores de curto-circuito (como `e` e `ou` em condicionais) adicionam pontos de decisão adicionais. Deseja que a complexidade ciclomática conte cada operador lógico individual em uma condicional ou apenas as estruturas de blocos (`se`, `enquanto`, `para`, etc.)? Por padrão, pretendemos focar estritamente nas estruturas de blocos, mantendo o cálculo mais simples e previsível.

---

## Alterações Propostas

### Interpretador (`src/interpreter/`)

---

#### [NEW] [metrics.js](file:///src/interpreter/metrics.js)

Módulo contendo a lógica de análise estática da AST para cálculo de complexidade.

* **Função `calculateCyclomaticComplexity(ast)`**: Percorre recursivamente as declarações e comandos da AST. A complexidade inicial é 1. Soma +1 para cada estrutura do tipo `if`, `while`, `for`, `repeat` e para cada ramificação `case` em uma estrutura de escolha (`choice`).
* **Função `estimateBigO(ast, source)`**:
  * Primeiro, varre o código fonte bruto à procura do padrão `// @complexidade <valor>`. Se encontrar, retorna a anotação do estudante.
  * Senão, calcula o nível máximo de aninhamento de laços (`while`, `for`, `repeat`).
    * Aninhamento 0 $\rightarrow$ `O(1)`
    * Aninhamento 1 $\rightarrow$ `~O(n)`
    * Aninhamento 2 $\rightarrow$ `~O(n²)`
    * Aninhamento $\ge 3$ $\rightarrow$ `~O(n³)` ou `~O(n^k)`
  * Analisa se há subprogramas recursivos (função ou procedimento que chama a si mesmo pelo nome) $\rightarrow$ marca com aviso de recursão ou complexidade exponencial (`~O(2^n)`).
* **Função `analyzeAstMetrics(ast, source)`**: Agrega ambos os resultados em um objeto `{ cyclomaticComplexity, bigO }`.

#### [MODIFY] [index.js](file:///src/interpreter/index.js)

Exportar a função de análise de métricas (`analyzeAstMetrics`) para uso externo pelo Renderer e pelos Workers.

#### [MODIFY] [flowchart.js](file:///src/interpreter/flowchart.js)

* Ao gerar o gráfico (`createFlowchartFromAst`), rastrear a profundidade dos laços.
* Adicionar uma propriedade `nestingDepth` a cada nó de laço ou decisão para que o gerador de SVG identifique quais nós são críticos (ex: laços de profundidade $\ge 2$).

---

### Renderer (`src/renderer/`)

---

#### [MODIFY] [index.html](file:///src/renderer/index.html)

* No dropdown de configurações (`#settingsDropdown`), adicionar o interruptor:

  ```html
  <label>
    <span>Mostrar métricas de complexidade</span>
    <input id="complexityMetricsSelect" class="switch-input" type="checkbox" role="switch" checked />
  </label>
  ```

* No cabeçalho do editor, expandir o container `#editorStatus` ou adicionar um elemento irmão `<div id="editorMetrics" class="editor-metrics" hidden></div>` para renderizar os badges.

#### [MODIFY] [theme.js](file:///src/renderer/theme.js)

* Adicionar suporte ao controle de preferências para `visualg-complexity-metrics`.
* Atualizar o método `init()` para escutar eventos de mudança no botão de alternância e sincronizar com o `localStorage`.
* Expor o método `isComplexityMetricsEnabled()`.

#### [MODIFY] [app.js](file:///src/renderer/app.js)

* Atualizar a lógica do editor de forma que, após qualquer atualização ou formatação de código, se as métricas estiverem ativadas:
  1. O código seja analisado via AST.
  2. As métricas sejam renderizadas no `#editorMetrics`.
  3. Ao desativar nas configurações, ocultar o elemento.

#### [MODIFY] [flowchart-dialog.js](file:///src/renderer/flowchart-dialog.js)

* Modificar a função `renderNode` para aplicar estilos diferenciados a nós com `nestingDepth >= 2` (ex: adicionar uma classe CSS `.flowchart-node-heavy` ou borda colorida diferenciada).
* Renderizar uma mini legenda de métricas no cabeçalho do modal.

#### [MODIFY] [styles.css](file:///src/renderer/styles.css)

* Estilizar os badges de métricas no cabeçalho do editor de acordo com a paleta Dracula (ex: roxo `#bd93f9` e ciano `#8be9fd`).
* Estilizar os caminhos e nós complexos do fluxograma.

---

### Testes (`test/`)

---

#### [NEW] [metrics.test.js](file:///test/metrics.test.js)

* Testes unitários para validar a detecção de:
  * Complexidade Ciclomática (estruturas lineares, condicionais aninhadas, escolha-caso).
  * Big O estimado em laços simples e ninhos de laços.
  * Substituição de Big O a partir de comentários de anotação de estudante (`// @complexidade O(...)`).
  * Detecção de recursão simples.

---

## Plano de Verificação

### Testes Automatizados

* Rodar a suíte completa de testes para garantir que não houve regressão:

  ```bash
  npm run verify
  ```

* Executar especificamente a suíte de testes de métricas:

  ```bash
  node --test test/metrics.test.js
  ```

### Verificação Manual

1. Abrir a aplicação com `npm start`.
2. Escrever um algoritmo com laços aninhados e verificar se a barra de status exibe corretamente a complexidade.
3. Abrir o fluxograma do algoritmo e verificar se os nós mais profundos estão destacados visualmente.
4. Desativar a opção nas configurações e confirmar se a exibição desaparece da barra de status do editor.
5. Adicionar a linha `// @complexidade O(log n)` no topo do algoritmo e verificar se a barra de status atualiza a métrica Big O conforme a anotação manual.
