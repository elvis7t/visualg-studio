algoritmo "SomaEMediaVetor"
var
  notas: vetor[1..5] de real
  i: inteiro
  soma, media: real
inicio
  soma <- 0

  para i de 1 ate 5 faca
    notas[i] <- i + 5
    soma <- soma + notas[i]
  fimpara

  media <- soma / 5
  escreval("Soma: ", soma)
  escreval("Media: ", media)
fimalgoritmo
