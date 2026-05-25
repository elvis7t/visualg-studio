# VisuAlg Studio

VisuAlg Studio e uma reconstrução desktop moderna do Visualg, feita em Electron e Node.js. O objetivo do projeto e oferecer uma IDE leve para escrever, executar e depurar algoritmos `.alg`, mantendo compatibilidade progressiva com a linguagem Visualg e uma experiencia visual mais atual.

## Visao Geral

O app entrega uma interface desktop com tema escuro, editor com numeração de linhas, autocomplete, destaque de sintaxe, busca/substituição, console de execução, entrada por modal para `leia(...)`, painel de depuração por etapa e empacotamento para Windows.

O interpretador roda localmente em Node.js. Execução e depuração tentam usar um Web Worker para evitar bloquear a UI; comandos `leia(...)` são atendidos por uma ponte assíncrona com o mesmo modal da interface. A distribuição original do Visualg não e modificada; os exemplos e recursos usados pelo app ficam dentro deste projeto.

## Funcionalidades

- Editor baseado em CodeMirror 6.
- Numeração de linhas e linha ativa.
- Autocomplete de comandos Visualg e variáveis declaradas no bloco `var`.
- Temas: Dracula, Dark e Visual Assist Dark.
- Painel de configurações integrado na barra lateral de atividades (acessível via ícone de engrenagem).
- Configurações de tema, posição dos painéis, fontes e tamanhos, tabulação, quebra de linha, guias de indentação e detecção de loop infinito.
- Abas de editor com persistência da sessão, indicador de alteração não salva e atalhos de navegação.
- Execução e depuração de algoritmos `.alg`, com ponte para Web Worker e fallback direto quando o Worker não estiver disponível.
- Campo `Entrada para leia` com múltiplas linhas e modal interativo quando a execução chegar em `leia(...)` sem valor pré-preenchido.
- Console com botão para limpar saída, entrada e depuração.
- Depuração por etapa com voltar, próximo, continuar até ponto de parada/fim, parar, pontos de parada na margem, Inspeção de expressão, tabela de variáveis com tipo e destaque da linha atual no editor.
- Painéis redimensionáveis entre editor, console e depuração, incluindo largura dos detalhes da depuração.
- Busca e substituição no editor.
- Exportação do código atual para `.alg`/`.txt` e impressão do algoritmo pelo painel de Ferramentas na barra lateral.
- Fluxograma automático do algoritmo atual, gerado a partir do AST do interpretador, com zoom/pan interativos e exportação completa para SVG e PNG.
- Documentação interna em seções sanfonadas na barra lateral: Linguagem, Editor, Depuração e Atalhos.
- Painel de Dicas dedicado na barra lateral de atividades.
- Tela Sobre (versão, licença e créditos/homenagem ao legado do Visualg) acessível via ícone de informações na barra lateral.
- Exemplos internos carregados no painel do Explorador na barra lateral por categoria.
- Atualizações automáticas integradas com o GitHub Releases via auto-updater (disponível na tela Sobre).
- Geração de executável e instalador Windows e Linux via `electron-builder`.

## Compatibilidade Atual da Linguagem

Suporte implementado:

- `algoritmo`, `var`, `inicio`, `fimalgoritmo`.
- Tipos `inteiro`, `real`, `caracter`/`caractere`, `logico`.
- `vetor[1..N] de tipo` e matrizes com múltiplas dimensões.
- Atribuição com `<-` e `:=`.
- `escreva`, `escreval`, `leia`.
- `se`, `senao`, `fimse`.
- `para`, `fimpara`.
- `enquanto`, `fimenquanto`.
- `repita ... ate`.
- `escolha`, `caso`, `outrocaso`, `fimescolha`.
- Ranges em `caso`, como `caso 1..5`.
- `interrompa`.
- Operadores aritméticos, lógicos e comparativos básicos.
- `limpatela`.
- `pausa`, `eco on/off`, `timer on/off`, `cronometro` e `aleatorio on/off` ou `aleatorio minimo,maximo`.
- Formatação básica em `escreva`/`escreval`, como `valor:6:2`.
- Múltiplos comandos simples na mesma linha separados por `;`.
- Funções nativas como `abs`, `raizq`, `sen`, `cos`, `tan`, `arcsen`, `arccos`, `arctan`, `cotan`, `int`, `quad`, `exp`, `log`, `logn`, `pi`, `grauprad`, `radpgrau`, `rand`, `randi`, `compr`, `maiusc`, `minusc`, `copia`, `pos`, `asc`, `carac`, `caracpnum`, `numpcarac`.
- Subprogramas com `procedimento`/`fimprocedimento` e `funcao`/`fimfuncao`.
- Parametros por valor, parametros por referencia com `var` para variaveis simples, itens de vetor e vetores completos, variaveis locais de subprograma, recursao e retorno com `retorne`.
- Validação de tipos desconhecidos nas declarações.

## Depuração

A depuração atual usa um executor pausável: o algoritmo avança sob demanda, `Próximo` resume a execução até o próximo passo e `Voltar` navega pelos passos já visitados. O passo selecionado destaca a linha correspondente no editor e atualiza o console com a saída acumulada ate o momento. Quando a execução encontra `leia(...)`, valores do campo `Entrada para leia` são consumidos primeiro; se faltarem valores, o Worker solicita a entrada para a UI e o app mostra o modal naquele momento da depuração.

O modelo antigo de trace completo ainda existe como API headless (`createDebugSession`) para testes, automações e fallback técnico, mas a interface principal já usa a sessão interativa (`createInteractiveDebugSession`). Limitações atuais:

- Step-into dedicado para subprogramas ainda não tem comando separado.
- Pontos de parada ainda são marcados por linha e não são persistidos entre sessões.

## Atalhos

- `Ctrl+N`: novo arquivo.
- `Ctrl+O`: abrir arquivo.
- `Ctrl+S`: salvar arquivo.
- `Ctrl+Z`: desfazer.
- `Ctrl+Y` ou `Ctrl+Shift+Z`: refazer.
- `Ctrl+D`: duplicar linha.
- `Ctrl+F`: buscar no editor.
- `Ctrl+H`: buscar e substituir.
- `Alt+Shift+F`: indentar o algoritmo.
- `Ctrl+W`: fechar aba ativa.
- `Ctrl+Tab`: próxima aba.
- `Ctrl+Shift+Tab`: aba anterior.
- `F9`: executar.
- `F5`: iniciar depuração.
- `F8`: avançar passo na depuração.
- `Shift+F8`: voltar passo na depuração.
- Clique no número da linha: marcar/remover ponto de parada.
- Campo `Inspeção` no painel de depuração: avaliar expressões no passo atual, como `baixo + alto` ou `notas[meio]`.
- Botão `Continuar`: executa até o próximo ponto de parada posterior ou até o fim do algoritmo.
- Botões `Ponto de parada anterior` e `Próximo ponto de parada`: saltar entre pontos de parada marcados já visitados sem trocar o comportamento passo a passo de `Voltar` e `Próximo`.
- `Limpeza`: limpa console, entrada e depuração; as vassouras locais limpam apenas o painel onde aparecem.

## Roadmap de Compatibilidade

Itens importantes ainda pendentes:

- Step-into para subprogramas.
- Layout avançado do fluxograma com ramificações em colunas.

Importante: a declaração de vetor cria a estrutura com valores padrão, mas não preenche uma sequência automaticamente. Para preencher `notas[1]` ate `notas[10]`, use um laço:

```visualg
para i de 1 ate 10 faca
  notas[i] <- i
fimpara
```

## Estrutura do Projeto

```text
.
├── docs/
│   ├── adrs/          # Architecture Decision Records
│   ├── operation/     # Guias operacionais com comandos copiáveis
│   └── superpowers/   # Specs e planos usados durante o desenvolvimento
├── examples/          # Exemplos .alg carregados pela interface
├── resources/         # Icones e identidade visual
├── scripts/           # Scripts auxiliares
├── src/
│   ├── interpreter/   # Parser, runtime e API do interpretador
│   ├── main/          # Processo main do Electron e preload
│   └── renderer/      # UI, editor, tema, arquivos e paineis
└── test/              # Testes automatizados
```

## Documentação Operacional

Os comandos do dia a dia ficam em [docs/operation/commands.md](docs/operation/commands.md).

Guias disponíveis:

- [Comandos do Projeto](docs/operation/commands.md)
- [Build e Distribuicao](docs/operation/build-and-release.md)
- [Troubleshooting](docs/operation/troubleshooting.md)

## Decisoes de Arquitetura

As decisões arquiteturais ficam em [docs/adrs](docs/adrs).

ADRs iniciais:

- [ADR 0001 - Electron como shell desktop](docs/adrs/0001-electron-desktop-shell.md)
- [ADR 0002 - Interpretador proprio em Node.js](docs/adrs/0002-node-visualg-interpreter.md)
- [ADR 0003 - CodeMirror 6 como editor](docs/adrs/0003-codemirror-editor.md)
- [ADR 0004 - Electron Builder para distribuicao Windows](docs/adrs/0004-electron-builder-windows-distribution.md)
- [ADR 0005 - Busca/substituicao customizada no editor](docs/adrs/0005-custom-search-panel.md)
- [ADR 0006 - Configuracoes em localStorage sem schema versionado](docs/adrs/0006-local-storage-settings.md)
- [ADR 0007 - Sessao de depuracao interativa](docs/adrs/0007-interactive-debug-session.md)
- [ADR 0008 - Interpretador em Web Worker](docs/adrs/0008-interpreter-web-worker.md)

## Desenvolvimento Rapido

Instale dependências:

```powershell
npm install
```

Inicie o app:

```powershell
npm start
```

Rode a verificação completa:

```powershell
npm run verify
```

Gere o executável Windows:

```powershell
npm run pack:win
```

Gere o instalador Windows:

```powershell
npm run dist:win
```

## Artefatos Gerados

Depois do build, os principais artefatos ficam em:

```text
dist/win-unpacked/VisuAlg Studio.exe
dist/VisuAlg Studio Setup 0.1.0.exe
```

## Status

Este projeto ainda está em evolução. A prioridade atual e ampliar compatibilidade com a linguagem Visualg, manter o depurador interativo estável e consolidar a execução/depuração em Worker com fallback técnico para ambientes sem suporte.

## Créditos e Homenagem

Este projeto, **VisuAlg Studio**, é uma reescrita independente em Node.js e Electron, inspirada no legado do Visualg.

- O Visualg original foi criado pelo professor **Claudio Morgado** e posteriormente promovido e mantido pelo professor **Antonio Carlos Nicolodi**, referência fundamental no ensino de algoritmos.
- Este projeto não é oficial, mas presta homenagem a esses educadores que marcaram gerações de estudantes de programação.

## Licença

Este projeto está licenciado sob os termos da [MIT License](LICENSE).

Inspirado e em homenagem aos professores Claudio Morgado e Antonio Carlos Nicolodi.
