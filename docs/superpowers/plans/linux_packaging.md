# Plano de Implementação: Suporte a Empacotamento para Linux (AppImage e .deb)

Este plano descreve o design e as alterações necessárias para habilitar o empacotamento oficial do **VisuAlg Studio** para sistemas **Linux** (gerando os formatos `AppImage` e `.deb`) e atualizar a esteira automatizada de build no GitHub Actions para compilar ambas as versões (Windows e Linux) em paralelo.

---

## Revisão Necessária (User Review)

> [!IMPORTANT]
> **Alteração do Fluxo da Release no GitHub Actions**:
> Para garantir que os instaladores de Windows e Linux sejam criados de forma limpa e que tenhamos um arquivo único unificado de somas de verificação (`SHA256SUMS.txt`), reestruturaremos o workflow `release.yml` em dois estágios:
> 1. **Job `build` (Matriz)**: Roda em paralelo no Windows (`windows-latest`) e no Linux (`ubuntu-latest`) para compilar os respectivos binários e salvá-los temporariamente como artefatos da Action.
> 2. **Job `release`**: Roda após o término dos builds, baixa os binários de ambas as plataformas, calcula o checksum SHA-256 unificado e cria a Release no GitHub com todos os arquivos.

---

## Perguntas em Aberto

> [!NOTE]
> * **Nome do Executável**: A configuração de empacotamento do Linux usará o nome de produto definido no `package.json` (`VisuALg Studio` ou `VisuAlg Studio`). Como a alteração do L maiúsculo foi pedida apenas para a página web de documentação, os binários manterão a nomenclatura do repositório, mas utilizaremos padrões de busca curinga (`*`) nas receitas para evitar quebra de scripts futuros caso o nome do projeto no `package.json` seja alterado.

---

## Alterações Propostas

### Configuração do Projeto (`package.json`)

---

#### [MODIFY] [package.json](file:///package.json)
* Adicionar o script `"dist:linux"` para executar o empacotador direcionado ao Linux.
* Configurar o nó `"linux"` na chave `"build"` especificando os formatos `AppImage` e `deb`, a categoria de desenvolvimento e a referência ao ícone de alta resolução existente em `resources/icon.png`.

Exemplo das alterações:
```json
{
  "scripts": {
    "dist:linux": "npm run build:renderer && electron-builder --linux"
  },
  "build": {
    "linux": {
      "target": [
        "AppImage",
        "deb"
      ],
      "category": "Development",
      "icon": "resources/icon.png"
    }
  }
}
```

---

### Integração Contínua (`.github/workflows/`)

---

#### [MODIFY] [release.yml](file:///.github/workflows/release.yml)
Substituir o workflow atual por uma estrutura baseada em jobs com matriz e etapa de publicação unificada:
1. **Job `build`**:
   * Roda em `matrix.os` contendo `[windows-latest, ubuntu-latest]`.
   * Executa `npm run verify` para rodar a suíte de testes unitários e validação sintática em ambas as plataformas.
   * Executa `npm run dist:win` (no Windows) ou `npm run dist:linux` (no Linux).
   * Compacta a versão portátil zip do Windows se estiver no runner Windows.
   * Utiliza `actions/upload-artifact@v4` para exportar os binários gerados na pasta `dist/`.
2. **Job `release`**:
   * Depende de `build` (`needs: build`).
   * Roda em `ubuntu-latest`.
   * Baixa os artefatos gerados usando `actions/download-artifact@v4`.
   * Executa o cálculo de checksum SHA-256 para todos os binários gerados.
   * Publica a tag de release contendo o instalador `.exe` (Windows), zip portátil (Windows), `.AppImage` (Linux), `.deb` (Linux) e o arquivo unificado `SHA256SUMS.txt`.

---

## Plano de Verificação

### Testes Automatizados
* A suíte de testes unitários da aplicação (`npm test` e `npm run check`) será validada tanto no ambiente Windows quanto no ambiente Linux durante as etapas do CI/CD no GitHub.

### Verificação Manual
1. Simular o empacotamento Linux localmente ou verificar o sucesso do pipeline no GitHub Actions ao gerar uma nova tag de versão (ex: `v0.1.1`).
2. Validar o funcionamento do executável `.AppImage` em uma distribuição Linux de teste (como Ubuntu):
   * Executar o comando `chmod +x VisuALg-Studio-*.AppImage`.
   * Executar o aplicativo.
   * Testar a execução de algoritmos simples e a geração de fluxogramas.
