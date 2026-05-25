# Contribuindo com o VisuAlg Studio

Obrigado por considerar contribuir com o **VisuAlg Studio**.

Este projeto e uma reescrita moderna e independente do Visualg em Node.js e Electron, com foco em ensino de algoritmos, compatibilidade com Portugol/Visualg e uma experiencia de IDE atual.

## Como contribuir

Voce pode ajudar de varias formas:

- Reportando bugs.
- Sugerindo melhorias de interface ou compatibilidade com Visualg.
- Criando exemplos `.alg`.
- Melhorando a documentacao.
- Escrevendo testes.
- Corrigindo problemas no interpretador, editor, depurador, fluxograma ou build.

Antes de abrir uma mudanca grande, prefira criar uma issue ou comentar em uma issue existente para alinhar o escopo.

## Preparando o ambiente

Requisitos recomendados:

- Node.js 20 ou superior.
- npm.
- Git.

Instale as dependencias:

```bash
npm install
```

Execute o app localmente:

```bash
npm start
```

## Comandos uteis

Rodar testes:

```bash
npm test
```

Rodar testes com cobertura:

```bash
npm run test:coverage
```

Validar testes e sintaxe:

```bash
npm run verify
```

Gerar bundle do renderer:

```bash
npm run build:renderer
```

Gerar app empacotado:

```bash
npm run pack
```

Gerar instalador Windows:

```bash
npm run dist:win
```

Gerar pacotes Linux:

```bash
npm run dist:linux
```

## Estrutura do projeto

- `src/interpreter/`: tokenizer, parser, runtime, depurador, metricas e fluxograma.
- `src/main/`: processo principal do Electron, preload, IPC e atualizador.
- `src/renderer/`: interface, editor, paineis, dialogs e cliente Worker.
- `examples/`: exemplos Visualg distribuidos com o app.
- `docs/`: documentacao, ADRs, operacao e site estatico.
- `test/`: testes com `node --test`.
- `resources/`: icones e recursos de build.

## Padroes de codigo

- Use JavaScript moderno com ES modules.
- Prefira funcoes pequenas e modulos focados.
- Preserve a separacao entre interpretador, main process e renderer.
- Evite misturar DOM/Electron dentro de `src/interpreter/`.
- Adicione testes para mudancas no interpretador, Worker, depurador e regras de linguagem.
- Para alteracoes no renderer, rode `npm run build:renderer` quando necessario.
- Nao edite `dist/` manualmente.

## Interpretador e compatibilidade Visualg

Ao mexer em comandos, tipos, funcoes nativas ou regras de sintaxe:

1. Adicione ou atualize testes em `test/`.
2. Inclua pelo menos um exemplo `.alg` quando a funcionalidade for didatica.
3. Atualize a documentacao se o comportamento for visivel para o usuario.
4. Mantenha mensagens de erro claras e, sempre que possivel, com numero de linha.

## Interface e experiencia

Ao alterar a UI:

- Mantenha o tema escuro atual e a identidade do VisuAlg Studio.
- Preserve responsividade dos paineis.
- Evite quebrar o fluxo principal: editar, executar, depurar e ver saida.
- Use nomes em portugues na interface.
- Prefira icones semanticamente claros.

## Fluxo recomendado para Pull Requests

1. Crie uma branch com nome objetivo:

```bash
git checkout -b feature/nome-da-melhoria
```

2. Faca commits pequenos e claros.

3. Rode a verificacao:

```bash
npm run verify
```

4. Se mexeu na UI, gere o bundle:

```bash
npm run build:renderer
```

5. Abra o Pull Request explicando:

- O que mudou.
- Por que mudou.
- Como testar.
- Prints ou GIFs, quando for mudanca visual.
- Issues relacionadas, se houver.

## Checklist antes de enviar PR

- [ ] O codigo esta focado no escopo da mudanca.
- [ ] `npm run verify` passa localmente.
- [ ] Testes foram adicionados ou atualizados quando necessario.
- [ ] A documentacao foi atualizada quando a mudanca afeta o usuario.
- [ ] O bundle do renderer foi atualizado se `src/renderer/` foi alterado.
- [ ] Nenhum arquivo gerado em `dist/` foi commitado por engano.

## Reportando bugs

Ao abrir uma issue de bug, inclua:

- Versao do VisuAlg Studio.
- Sistema operacional.
- Codigo `.alg` minimo que reproduz o problema.
- Resultado esperado.
- Resultado obtido.
- Prints, logs ou mensagem de erro.

## Sugerindo funcionalidades

Ao sugerir uma funcionalidade, descreva:

- Qual problema ela resolve.
- Como o Visualg original se comporta, se for uma questao de compatibilidade.
- Como voce imagina a experiencia na UI.
- Se e essencial para ensino ou apenas melhoria de conveniencia.

## Releases

As releases sao publicadas pelo GitHub Releases e usam os metadados do `electron-builder` para atualizacao automatica.

Mudancas relacionadas a release devem considerar:

- Windows: instalador NSIS.
- Linux: AppImage e `.deb`.
- Arquivos `latest.yml` e `latest-linux.yml`.
- Checksums SHA-256.
- Teste de instalacao e atualizacao.

## Codigo de Conduta

Todas as contribuicoes devem seguir o [Codigo de Conduta](CODE_OF_CONDUCT.md).

## Licenca

Ao contribuir, voce concorda que sua contribuicao sera distribuida sob os termos da licenca MIT do projeto.
