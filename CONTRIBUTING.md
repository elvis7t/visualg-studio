# Guia de Contribuição

Obrigado por seu interesse em contribuir para o **VisuALg Studio**! Este projeto é uma iniciativa de código aberto para fornecer uma IDE moderna e amigável para o aprendizado de algoritmos em Portugol.

Para manter a qualidade e consistência do projeto, pedimos que siga as diretrizes abaixo.

---

## Como Começar

### 1. Requisitos Prévios
Certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 18 ou superior)
- **NPM** (gerenciador de pacotes do Node)
- **Git**

### 2. Configurando o Ambiente Local
1. Faça o fork do repositório no GitHub.
2. Clone o seu fork localmente:
   ```bash
   git clone https://github.com/SEU-USUARIO/visualg-studio.git
   cd visualg-studio
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o aplicativo em modo de desenvolvimento:
   ```bash
   npm start
   ```

---

## Diretrizes de Desenvolvimento

### Estilo de Código
- Escreva código em **JavaScript puro (Vanilla JS)**.
- Utilize **módulos ES** (`import`/`export`) para manter a compatibilidade com a arquitetura atual.
- Mantenha o padrão de formatação e nomes consistentes com o código existente.

### Testes Automatizados
Antes de propor qualquer alteração, certifique-se de que a suíte de testes do interpretador continua passando:
```bash
npm test
```

Para verificar se não há erros de sintaxe nos arquivos principais:
```bash
npm run check
```

Você também pode executar ambos em um único comando:
```bash
npm run verify
```

---

## Enviando um Pull Request (PR)

1. Crie uma branch para a sua modificação:
   ```bash
   git checkout -b minha-melhoria
   ```
2. Realize as alterações e adicione testes correspondentes se modificar a lógica do interpretador.
3. Faça commit das alterações com mensagens claras e objetivas.
4. Faça o push para a branch no seu fork:
   ```bash
   git push origin minha-melhoria
   ```
5. Abra o Pull Request apontando para a branch `main` do repositório original.
6. Preencha o template de PR detalhando as modificações e os testes realizados.

---

## Reportando Problemas ou Sugestões
Se você encontrar um erro ou tiver uma sugestão de melhoria (como suporte a um comando adicional da sintaxe do Visualg):
- Verifique se o problema já não foi relatado nas [Issues](https://github.com/elvis7t/visualg-studio/issues).
- Se for novo, abra uma nova issue utilizando o template apropriado (**Bug Report** ou **Feature Request**).
