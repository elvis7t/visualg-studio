# ADR 0008 - Interpretador em Web Worker

## Status

Aceita parcialmente.

## Contexto

O interpretador Visualg hoje roda no renderer. Ele e puro JavaScript e nao depende de DOM, Electron ou sistema de arquivos durante a execução de um algoritmo. Isso facilita testes e torna viável mover a execução para fora da thread principal da UI.

Programas longos, loops grandes, fluxogramas e sessões de depuração interativa podem competir com a responsividade da interface. Antes de mover o interpretador, o runtime foi modularizado e o depurador interativo foi separado em `debug-session.js`.

## Decisao

Começar com um Web Worker no renderer para executar o interpretador. A UI conversara com o Worker por um protocolo explícito de mensagens. A primeira entrega move execução normal (`run`) e sessões de depuração para o Worker. Quando o algoritmo encontra `leia(...)`, o Worker emite `read:request`, a UI coleta o valor com o mesmo modal atual e responde com `read:response`. O executor direto permanece como fallback técnico quando o Worker não estiver disponível.

Mensagens previstas:

- `run:start`: executa o algoritmo e retorna saída ou erro.
- `debug:start`: inicia sessão de depuração com breakpoints e opções.
- `debug:next`: avança um passo.
- `debug:previous`: navega para passo anterior já visitado.
- `debug:continue`: executa até próximo ponto de parada posterior ou fim.
- `debug:stop`: encerra sessão.
- `read:request`: Worker pede valor para `leia(...)`, incluindo o id da execução/sessão.
- `read:response`: UI envia valor informado pelo usuário ou erro de cancelamento.
- `watch:evaluate`: avalia expressão no snapshot atual.

## Consequencias

- A UI deve ficar responsiva durante execuções pesadas.
- O contrato de mensagens precisa ser testado sem depender do Electron.
- O Worker não deve acessar DOM, janela, IPC ou APIs do processo main.
- A depuração interativa exige ponte assíncrona para pausar, retomar e responder `leia(...)`.
- Caso o Worker falhe ou não esteja disponível, o executor direto atual continua como fallback técnico.
