# Comandos do Projeto

Este arquivo lista os comandos mais usados no VisuAlg Studio. Os blocos estão prontos para copiar e colar no PowerShell.

## Entrar na Pasta do Projeto

```powershell
cd C:\Users\elvis\Documents\Codex\2026-05-21\c-users-elvis-downloads-visualg3-0
```

## Instalar Dependencias

Use quando clonar/copiar o projeto ou quando `package.json` mudar.

```powershell
npm install
```

## Iniciar o App em Desenvolvimento

Gera o bundle do renderer e abre o Electron.

```powershell
npm start
```

## Gerar Bundle do Renderer

Empacota a UI do renderer, incluindo CodeMirror.

```powershell
npm run build:renderer
```

## Rodar Testes

Executa os testes automatizados com `node:test`.

```powershell
npm test
```

## Rodar um Arquivo de Teste Especifico

Use quando estiver trabalhando em uma área isolada.

```powershell
node --test test\interpreter.test.js
```

Filtre por nome do teste:

```powershell
node --test --test-name-pattern="native functions" test\interpreter.test.js
```

## Rodar Checagem de Sintaxe

Verifica se os arquivos JavaScript principais carregam sem erro de sintaxe.

```powershell
npm run check
```

## Verificacao Completa

Roda testes e checagem de sintaxe.

```powershell
npm run verify
```

## Gerar Executavel Unpacked

Gera uma pasta com o `.exe` pronto para abrir, sem instalador.

```powershell
npm run pack:win
```

Saida esperada:

```text
dist\win-unpacked\VisuAlg Studio.exe
```

## Gerar Instalador Windows

Gera instalador NSIS `.exe`.

```powershell
npm run dist:win
```

Saida esperada:

```text
dist\VisuAlg Studio Setup 0.1.0.exe
```

## Checar Versao do Electron Builder

```powershell
npx electron-builder --version
```

## Checar Versao do Electron

```powershell
npx electron --version
```

## Atalhos do App

| Atalho | Acao |
| --- | --- |
| `Ctrl+N` | Novo arquivo |
| `Ctrl+O` | Abrir arquivo `.alg` |
| `Ctrl+S` | Salvar arquivo atual |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` | Refazer |
| `Ctrl+Shift+Z` | Refazer |
| `Ctrl+D` | Duplicar linha |
| `Ctrl+F` | Buscar no editor |
| `Ctrl+H` | Buscar e substituir |
| `Alt+Shift+F` | Indentar algoritmo |
| `Ctrl+W` | Fechar aba ativa |
| `Ctrl+Tab` | Próxima aba |
| `Ctrl+Shift+Tab` | Aba anterior |
| `Enter` na busca | Proxima ocorrencia |
| `Shift+Enter` na busca | Ocorrencia anterior |
| `F9` | Executar |
| `F5` | Iniciar Depuração |
| `F8` | Avancar passo |
| `Shift+F8` | Voltar passo |
| Clique no número da linha | Marcar/remover breakpoint |

## Abas do Editor

O editor mantém múltiplas abas em memória e restaura a sessão ao abrir o app novamente.

```text
Ctrl+W          fecha a aba atual
Ctrl+Tab        vai para a próxima aba
Ctrl+Shift+Tab  volta para a aba anterior
```

Abas com alterações não salvas exibem um marcador amarelo. Ao fechar uma aba alterada, o app pede confirmação.

## Comandos Utilitários Visualg

Comandos aceitos atualmente:

```visualg
limpatela
pausa
eco on
eco off
timer on
timer off
cronometro
aleatorio 1, 10
aleatorio off
```

Exemplo com `aleatorio`:

```visualg
algoritmo "NumeroAleatorio"
var
  numero: inteiro
inicio
  aleatorio 1, 10
  leia(numero)
  aleatorio off

  escreval("Numero sorteado: ", numero)
fimalgoritmo
```

## Entrada para `leia`

Preencha entradas opcionais por linha no campo `Entrada para leia`. A execução consome esses valores primeiro. Se chegar em um `leia(...)` sem valor disponível, o app abre o modal interativo apenas para aquele valor.

```text
Maria
18
```

Tambem e aceito separar por `|`:

```text
Maria | 18
```

O botão `Limpeza` da barra principal limpa console, Depuração e esse campo de entrada.

As vassouras locais limpam apenas uma area:

```text
Vassoura do Console    limpa apenas a saida do console
Vassoura da Depuração  limpa apenas a sessão de Depuração
```

## Comandos na Mesma Linha

Separe comandos simples com `;`:

```visualg
a <- 1; b <- 2
escreva(a); escreval(b)
```

## Inspeção de Depuração

Durante uma sessão de Depuração, use o Campo `Inspeção` nos detalhes para avaliar expressões contra o passo atual.

Exemplos:

```text
baixo + alto
notas[meio]
chute = item
```

O resultado muda ao usar `F8`, `Shift+F8`, `Próximo` ou `Voltar`.

O texto cinza dentro do campo e apenas sugestao. Digite a expressao para ver o resultado.

## Navegar Entre Breakpoints

`Próximo` e `Voltar` continuam andando passo a passo.

Para saltar entre breakpoints marcados, use os botoes:

```text
Ponto de parada anterior
Próximo ponto de parada
```
