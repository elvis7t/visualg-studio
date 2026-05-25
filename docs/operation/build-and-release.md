# Build e Distribuicao

Este guia descreve o fluxo recomendado para gerar um executável ou instalador do VisuAlg Studio.

## 1. Entrar na Pasta do Projeto

```powershell
cd C:\Users\elvis\Documents\Codex\2026-05-21\c-users-elvis-downloads-visualg3-0
```

## 2. Instalar Dependencias

```powershell
npm install
```

## 3. Rodar Verificacao

```powershell
npm run verify
```

Continue apenas se a verificação passar.

## 4. Gerar Bundle do Renderer

Use quando quiser validar apenas a UI antes de empacotar.

```powershell
npm run build:renderer
```

## 5. Gerar Build de Teste

```powershell
npm run pack:win
```

Abra o executável:

```powershell
.\dist\win-unpacked\"VisuAlg Studio.exe"
```

## 6. Gerar Instalador Windows

```powershell
npm run dist:win
```

Instalador gerado:

```text
dist\VisuAlg Studio Setup 0.1.0.exe
```

## 7. Gerar Empacotamento Linux

Para gerar os pacotes `.deb` e `.AppImage` para Linux, execute:

```powershell
npm run dist:linux
```

Pacotes gerados:

```text
dist/visualg-studio_0.1.0_amd64.deb
dist/visualg-studio-0.1.0.AppImage
```

## 8. Checklist Manual

Antes de distribuir:

- Abra `dist\win-unpacked\VisuAlg Studio.exe`.
- Carregue `examples\basicos\entrada-e-saida.alg`.
- Execute com `F9` e confirme que o modal aparece quando o algoritmo chegar em `leia(...)`.
- Inicie Depuração com `F5`.
- Marque um breakpoint clicando no número da linha e confirme que a Depuração abre nesse ponto.
- Use `F8` e `Shift+F8`.
- Abra duas abas, altere uma delas, teste `Ctrl+Tab`, `Ctrl+Shift+Tab` e `Ctrl+W`.
- Teste `Ctrl+F` e `Ctrl+H` no editor.
- Clique em `Limpar` e confirme que console, Depuração e `Entrada para leia` foram limpos.
- Confira o icone no executavel, atalho da area de trabalho e menu iniciar.

## 9. Observacao Sobre Icone

O ícone fica em:

```text
resources\icon.ico
```

Se o Windows Explorer mostrar ícone antigo, pode ser cache do Windows. Feche e reabra o Explorer, renomeie o artefato ou reinstale a aplicação.
