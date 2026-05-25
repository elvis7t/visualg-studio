algoritmo "Matriz2x2"
var
  matriz: vetor[1..2, 1..2] de inteiro
  linha, coluna: inteiro
inicio
  para linha de 1 ate 2 faca
    para coluna de 1 ate 2 faca
      matriz[linha, coluna] <- linha + coluna
    fimpara
  fimpara

  escreval("Valor central: ", matriz[1, 1])
  escreval("Ultimo valor: ", matriz[2, 2])
fimalgoritmo
