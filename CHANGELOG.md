# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

## 0.1.0 - 2026-05-23

### Adicionado

- IDE desktop Electron com editor CodeMirror, tema Dracula, Dark e Visual Assist Dark.
- Execução local de algoritmos `.alg` por interpretador em Node.js.
- Depuração por etapa com voltar, próximo, parar, pontos de parada na margem, destaque da linha atual e painel de variáveis.
- Executor de depuração pausável, com avanço sob demanda e `leia(...)` solicitado no momento da execução.
- Ação `Continuar` para executar até o próximo ponto de parada posterior ou até o fim do algoritmo.
- Campo de Inspeção para avaliar expressões durante a depuração.
- Console com entrada para `leia`, modal de entrada e limpeza separada por painel.
- Entrada interativa para `leia(...)`: valores pré-preenchidos são consumidos primeiro e o modal aparece apenas quando faltar entrada.
- Abas de editor com indicador de alteração não salva, persistência de sessão e atalhos `Ctrl+W`, `Ctrl+Tab` e `Ctrl+Shift+Tab`.
- Exportação do código atual para `.alg`/`.txt` e impressão pelo menu de configurações.
- Fluxograma automático do algoritmo atual, com visualização em SVG no app e exportação para SVG/PNG.
- Configurações com switches e sliders para tema, layout, fonte, tamanho de fonte, quebra de linha, guias, loop infinito e painel de depuração.
- Tela Sobre com versão, licença e créditos ao legado do Visualg.
- Exemplos internos por categoria, incluindo vetores, subprogramas, funções nativas, utilitários e aleatório.
- Compatibilidade com vetores, matrizes, seleção, repetição, escolha com ranges, funções, procedimentos, recursão e parâmetros por referência.
- Parâmetros `var` aceitando vetores completos com validação de tipo e dimensões.
- Comandos utilitários `limpatela`, `pausa`, `eco`, `timer`, `cronometro` e `aleatorio`.
- Funções nativas matemáticas, trigonométricas e de texto.
- Múltiplos comandos simples por linha com separador `;`.
- Build Windows com `electron-builder`, executável unpacked e instalador NSIS.

### Melhorado

- Mensagens de erro com sugestão para comandos digitados incorretamente.
- README, documentação operacional, ADRs e créditos/homenagem ao legado do Visualg.
- Identidade visual, ícones e nome do aplicativo como VisuAlg Studio.
- Arquitetura do interpretador com módulos separados para comandos utilitários, escolha/casos, estado de execução, snapshots, declarações, acesso a variáveis, sugestões de comando, funções nativas e sessões de depuração.
- `createDebugSession` documentado como API headless/compatibilidade; a interface principal usa o depurador interativo pausável.
- Ponte de execução e depuração via Web Worker, incluindo `leia(...)` por `read:request/read:response` e fallback direto quando o Worker não estiver disponível.
