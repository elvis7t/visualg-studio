algoritmo "BuscaBinaria"

// Exemplo complexo com vetor, enquanto, escolha de intervalo e interrompa.

var
  notas: vetor[1..10] de inteiro
  baixo, alto, meio, chute, item, i: inteiro

inicio
  para i de 1 ate 10 faca
    notas[i] <- i
  fimpara

  baixo <- 1
  alto <- 10
  item <- 7

  enquanto baixo <= alto faca
    meio <- (baixo + alto) div 2
    chute <- notas[meio]

    escreval("--------------------")
    escreval("baixo: ", baixo)
    escreval("alto: ", alto)
    escreval("meio: ", meio)
    escreval("chute: ", chute)

    se chute = item entao
      escreval("Encontrou o item!")
      interrompa
    senao
      se chute > item entao
        escreval("Procurando na esquerda")
        alto <- meio - 1
      senao
        escreval("Procurando na direita")
        baixo <- meio + 1
      fimse
    fimse
  fimenquanto
fimalgoritmo
