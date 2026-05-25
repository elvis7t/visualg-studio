algoritmo "FatorialRecursivo"

funcao fatorial(n: inteiro): inteiro
inicio
  se n <= 1 entao
    retorne 1
  fimse

  retorne n * fatorial(n - 1)
fimfuncao

inicio
  escreval("5! = ", fatorial(5))
fimalgoritmo
