# Build e Distribuicao

Este guia descreve o fluxo recomendado para gerar executaveis, instaladores e releases do VisuAlg Studio.

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

No CI, o workflow `.github/workflows/ci.yml` roda `npm run check` e `npm run test:coverage` em `ubuntu-latest` e `windows-latest`.

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

## 7. Gerar ZIP Portatil Windows

O ZIP portatil e gerado a partir da pasta `dist\win-unpacked`.

Este comando depende de PowerShell e do cmdlet `Compress-Archive`. Ele deve ser executado em Windows. Em ambientes Linux/WSL, use apenas os builds Linux ou gere o portatil pelo workflow de release.

Para gerar localmente:

```powershell
npm run portable:win
```

Arquivo gerado:

```text
dist\VisuAlg-Studio-Portable-Windows.zip
```

No workflow de release, o job Windows roda `npm run dist:win` e depois `npm run zip:portable:win`, reutilizando a pasta `dist\win-unpacked` criada pelo `electron-builder`.

O job Linux nao executa `zip:portable:win`; ele gera apenas `.deb`, `.AppImage`, `latest-linux.yml` e arquivos relacionados.

## 8. Gerar Empacotamento Linux

Para gerar os pacotes `.deb` e `.AppImage` para Linux, execute em ambiente Linux ou no workflow do GitHub Actions:

```powershell
npm run dist:linux
```

Pacotes gerados:

```text
dist/visualg-studio_0.1.0_amd64.deb
dist/visualg-studio-0.1.0.AppImage
```

## 9. GitHub Releases e Auto-Update

O auto-update usa GitHub Releases como fonte publica de versoes. O `package.json` configura o provider `github` para `elvis7t/visualg-studio`, e o workflow `.github/workflows/release.yml` publica os artefatos quando uma tag `v*` e enviada.

Arquivos importantes para update automatico:

```text
dist/VisuAlg Studio Setup 0.1.0.exe
dist/VisuAlg Studio Setup 0.1.0.exe.blockmap
dist/latest.yml
dist/VisuAlg Studio-0.1.0.AppImage
dist/latest-linux.yml
dist/SHA256SUMS.txt
```

O arquivo `SHA256SUMS.txt` nao e gerado pelos scripts locais de build. Ele e criado no job final do `.github/workflows/release.yml`, depois que os artefatos Windows e Linux sao baixados para a pasta `dist`:

```bash
cd dist
sha256sum *.exe *.zip *.deb *.AppImage > SHA256SUMS.txt
cat SHA256SUMS.txt
```

Esse arquivo e publicado junto com a GitHub Release e deve ser usado para conferir a integridade dos artefatos baixados.

Fluxo de release:

```powershell
npm version patch
git push
git push --tags
```

No GitHub Actions, confirme que a release contem:

- instalador Windows `.exe`;
- arquivo `.blockmap` do instalador;
- `latest.yml`;
- pacote Linux `.deb`;
- pacote Linux `.AppImage`;
- `latest-linux.yml`;
- `SHA256SUMS.txt`.

Para testar o auto-update:

1. Instale uma versao anterior do app.
2. Publique uma release com versao maior.
3. Abra o app instalado.
4. Va em `Sobre > Verificar atualizacoes`.
5. Confirme que o app encontra a nova versao, baixa, instala e reinicia.

## 10. Checklist Manual

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
- Abra `Sobre > Verificar atualizacoes` e confirme que o estado da atualizacao aparece sem erro inesperado.
- Confira o icone no executavel, atalho da area de trabalho e menu iniciar.

## 11. Observacao Sobre Icone

O ícone fica em:

```text
resources\icon.ico
```

Se o Windows Explorer mostrar ícone antigo, pode ser cache do Windows. Feche e reabra o Explorer, renomeie o artefato ou reinstale a aplicação.
