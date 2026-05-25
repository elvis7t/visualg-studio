algoritmo "MediaComConceito"
var
  nota1, nota2, media: real
inicio
  nota1 <- 8.5
  nota2 <- 6.5
  media <- (nota1 + nota2) / 2

  se media >= 7 entao
    escreval("Aprovado: ", media:4:1)
  senao
    escreval("Recuperacao: ", media:4:1)
  fimse
fimalgoritmo
