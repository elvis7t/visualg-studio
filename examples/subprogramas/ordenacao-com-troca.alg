algoritmo "OrdenacaoComTroca"

procedimento troca(var a: inteiro, var b: inteiro)
var
  temp: inteiro
inicio
  temp <- a
  a <- b
  b <- temp
fimprocedimento

var
  valores: vetor[1..5] de inteiro
  i, j: inteiro
inicio
  valores[1] <- 5
  valores[2] <- 1
  valores[3] <- 4
  valores[4] <- 2
  valores[5] <- 3

  para i de 1 ate 4 faca
    para j de i + 1 ate 5 faca
      se valores[j] < valores[i] entao
        troca(valores[i], valores[j])
      fimse
    fimpara
  fimpara

  para i de 1 ate 5 faca
    escreval(valores[i])
  fimpara
fimalgoritmo
