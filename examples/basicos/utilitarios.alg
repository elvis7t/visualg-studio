algoritmo "TesteUtilitarios"
var
  i: inteiro
  nome: caracter
inicio
  debug on
  escreval("Modo debug ativado via codigo...")
  debug off
  escreval("Modo debug desativado via codigo...")

  timer on
  escreval("Iniciando timer de 500ms por comando...")
  escreva("Passo 1...")
  escreva("Passo 2...")
  timer off
  escreval("Fim do timer.")
  
  eco off
  escreval("Silenciando eco. Digite algo (não será replicado na tela):")
  leia(nome)
  escreval("O valor lido com eco off foi: ", nome)
  
  eco on
  escreval("Lendo com eco ativo. Digite algo (será impresso na tela):")
  leia(nome)
  escreval("O valor lido com eco on foi: ", nome)
  
  escreval("Cronometrando laço:")
  cronometro
  para i de 1 ate 1000 faca
    // Loop simples
  fimpara
  cronometro
  
  escreval("Demonstrando pausa (insira qualquer valor no prompt para continuar)...")
  pausa
  escreval("Fim do algoritmo de utilitários.")
fimalgoritmo
