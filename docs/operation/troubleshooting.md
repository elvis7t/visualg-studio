# Troubleshooting

## O App Abre sem CodeMirror ou com Tela Quebrada

Gere novamente o bundle do renderer:

```powershell
npm run build:renderer
```

Depois abra:

```powershell
npm start
```

## O Instalador Continua com Icone Antigo

Rebuild completo:

```powershell
npm run dist:win
```

Se ainda aparecer antigo no Explorer, limpe o cache visual fechando e reabrindo o Explorer ou renomeie o instalador gerado.

## `npm install` Mostra Vulnerabilidades

Auditoria:

```powershell
npm audit
```

Correção conservadora:

```powershell
npm audit fix
```

Evite usar `npm audit fix --force` sem revisar, porque pode trocar versões com breaking changes.

## O App Nao Carrega Exemplos

Verifique se a pasta existe:

```powershell
dir examples
```

Rode os testes:

```powershell
npm test
```

## O Interpretador Aceita Algo que Deveria Dar Erro

Adicione um teste em:

```text
test\interpreter.test.js
```

Depois rode:

```powershell
npm test
```

O padrão do projeto e corrigir compatibilidade criando primeiro uma reprodução em teste.

## Atalhos F5/F8/F9 Nao Respondem

Gere novamente o bundle do renderer:

```powershell
npm run build:renderer
```

Atalhos esperados:

```text
F9        executar
F5        iniciar Depuração
F8        avancar passo
Shift+F8  voltar passo
```

Se o app aberto continuar com o comportamento antigo, feche a janela do Electron e abra novamente com:

```powershell
npm start
```

## Entrada para Leia Junta Valores

O campo `Entrada para leia` deve preservar uma entrada por linha:

```text
Mat
12
```

Se aparecer como `Mat12`, o app provavelmente esta rodando um bundle antigo. Rode:

```powershell
npm run build:renderer
```

Depois reinicie o app.

## botão Limpar Nao Limpa a Entrada

O comportamento esperado e limpar console, Depuração e `Entrada para leia`. Se isso nao acontecer, rode:

```powershell
npm run verify
```

Se os testes passarem, gere o bundle novamente:

```powershell
npm run build:renderer
```
