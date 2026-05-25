algoritmo "MediaComFuncao"

// Exemplo simples de funcao com parametros e retorno.

funcao media(a: real; b: real; c: real): real
inicio
  retorne (a + b + c) / 3
fimfuncao

var
  resultado: real

inicio
  resultado <- media(8.5, 7.0, 9.5)
  escreval("Media: ", resultado:1:2)

  se resultado >= 7 entao
    escreval("Situacao: aprovado")
  senao
    escreval("Situacao: revisar conteudo")
  fimse
fimalgoritmo
