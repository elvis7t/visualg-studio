algoritmo "MenuEscolha"
var
  opcao: inteiro
inicio
  opcao <- 2

  escolha opcao
    caso 1
      escreval("Cadastrar")
    caso 2
      escreval("Listar")
    caso 3..5
      escreval("Relatorios")
    outrocaso
      escreval("Opcao invalida")
  fimescolha
fimalgoritmo
