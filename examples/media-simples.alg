algoritmo "MediaSimples"
var
  nota1, nota2, media: real
inicio
  nota1 <- 8
  nota2 <- 6
  media <- (nota1 + nota2) / 2
  escreval("Media: ", media)
  se media >= 7 entao
    escreval("Aprovado")
  senao
    escreval("Reprovado")
  fimse
fimalgoritmo
