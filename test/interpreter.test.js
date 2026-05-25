import test from 'node:test';
import assert from 'node:assert/strict';
import { collectReadVariables, createDebugSession, createInteractiveDebugSession, debugVisualg, evaluateWatchExpression, runVisualg } from '../src/interpreter/index.js';
import { parseVisualg } from '../src/interpreter/parser.js';

test('runs output and variable assignments', async () => {
  const result = await runVisualg(`
algoritmo "Media"
var
  nota1, nota2, media: real
inicio
  nota1 <- 8
  nota2 <- 6
  media <- (nota1 + nota2) / 2
  escreval("Media: ", media)
fimalgoritmo
`);

  assert.equal(result.output.join('\n'), 'Media: 7');
});

test('reads input values with leia', async () => {
  const result = await runVisualg(`
algoritmo "Entrada"
var
  nome: caracter
inicio
  escreva("Nome: ")
  leia(nome)
  escreval("Ola, ", nome)
fimalgoritmo
`, { input: ['Elvis'] });

  assert.equal(result.output.join('\n'), 'Nome: Ola, Elvis');
});

test('requests input interactively when leia has no queued value', async () => {
  const requested = [];
  const result = await runVisualg(`
algoritmo "EntradaInterativa"
var
  nome: caracter
inicio
  escreva("Nome: ")
  leia(nome)
  escreval("Ola, ", nome)
fimalgoritmo
`, {
    async onRead(request) {
      requested.push(request);
      return 'Maria';
    }
  });

  assert.deepEqual(requested.map((request) => ({ name: request.name, line: request.line })), [
    { name: 'nome', line: 7 }
  ]);
  assert.equal(result.output.join('\n'), 'Nome: Ola, Maria');
});

test('uses queued leia values before requesting interactive input', async () => {
  const requested = [];
  const result = await runVisualg(`
algoritmo "EntradaMista"
var
  nome, cidade: caracter
inicio
  leia(nome)
  leia(cidade)
  escreval(nome, " - ", cidade)
fimalgoritmo
`, {
    input: ['Ana'],
    async onRead(request) {
      requested.push(request.name);
      return 'Recife';
    }
  });

  assert.deepEqual(requested, ['cidade']);
  assert.deepEqual(result.output, ['Ana - Recife']);
});

test('executes conditionals', async () => {
  const result = await runVisualg(`
algoritmo "Conceito"
var
  media: real
inicio
  media <- 6.5
  se media >= 7 entao
    escreval("aprovado")
  senao
    escreval("reprovado")
  fimse
fimalgoritmo
`);

  assert.deepEqual(result.output, ['reprovado']);
});

test('executes multiple simple statements separated by semicolon', async () => {
  const result = await runVisualg(`
algoritmo "PontoVirgula"
var
  a, b: inteiro
inicio
  a <- 1; b <- 2
  escreva(a); escreval(b)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['12']);
});

test('executes para loops', async () => {
  const result = await runVisualg(`
algoritmo "Loop"
var
  i, soma: inteiro
inicio
  soma <- 0
  para i de 1 ate 4 faca
    soma <- soma + i
  fimpara
  escreval(soma)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['10']);
});

test('executes enquanto loops', async () => {
  const result = await runVisualg(`
algoritmo "Enquanto"
var
  i: inteiro
inicio
  i <- 1
  enquanto i < 4 faca
    escreval(i)
    i <- i + 1
  fimenquanto
fimalgoritmo
`);

  assert.deepEqual(result.output, ['1', '2', '3']);
});

test('allows configuring infinite loop detection', async () => {
  const source = `
algoritmo "LoopGuard"
var
  i: inteiro
inicio
  i <- 0
  enquanto verdadeiro faca
    i <- i + 1
    se i = 3 entao
      interrompa
    fimse
  fimenquanto
  escreval(i)
fimalgoritmo
`;

  await assert.rejects(
    () => runVisualg(source, { loopGuardLimit: 1 }),
    /Loop enquanto excedeu o limite de seguranca/
  );

  const result = await runVisualg(source, { detectInfiniteLoop: false });
  assert.deepEqual(result.output, ['3']);
});

test('debug mode returns execution steps and variable snapshots', async () => {
  const result = await debugVisualg(`
algoritmo "Debug"
var
  i, soma: inteiro
inicio
  soma <- 0
  para i de 1 ate 2 faca
    soma <- soma + i
  fimpara
  escreval(soma)
fimalgoritmo
`);

  assert.equal(result.output.join('\n'), '3');
  assert.deepEqual(result.steps.at(-1).variables, { i: 2, soma: 3 });
  assert.deepEqual(result.steps.at(-1).variableTypes, { i: 'inteiro', soma: 'inteiro' });
  assert.ok(result.steps.some((step) => step.statement === 'for'));
  assert.ok(result.steps.some((step) => step.line === 6));
});

test('debug step hook pauses execution before leia requests input', async () => {
  let readCalled = false;
  let releaseReadStep;
  const reachedReadStep = new Promise((resolve) => {
    releaseReadStep = resolve;
  });
  let resumeReadStep;

  const run = debugVisualg(`
algoritmo "DebugInterativo"
var
  nome: caracter
inicio
  leia(nome)
  escreval(nome)
fimalgoritmo
`, {
    async onDebugStep(step) {
      if (step.statement !== 'read' || step.phase !== 'before') return;
      releaseReadStep();
      await new Promise((resolve) => {
        resumeReadStep = resolve;
      });
    },
    async onRead() {
      readCalled = true;
      return 'Ana';
    }
  });

  await reachedReadStep;
  assert.equal(readCalled, false);
  resumeReadStep();
  const result = await run;
  assert.equal(readCalled, true);
  assert.deepEqual(result.output, ['Ana']);
});

test('supports one-based vector declarations and indexed assignment', async () => {
  const result = await runVisualg(`
algoritmo "Vetor"
var
  notas: vetor[1..3] de inteiro
  total: inteiro
inicio
  notas[1] <- 1
  notas[2] <- 2
  notas[3] <- 3
  total <- notas[1] + notas[2] + notas[3]
  escreval(total)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['6']);
});

test('supports interrompa inside loops', async () => {
  const result = await runVisualg(`
algoritmo "Interrompa"
var
  i: inteiro
inicio
  para i de 1 ate 5 faca
    escreval(i)
    se i = 3 entao
      interrompa
    fimse
  fimpara
  escreval("fim")
fimalgoritmo
`);

  assert.deepEqual(result.output, ['1', '2', '3', 'fim']);
});

test('creates a step-by-step debug session', async () => {
  const session = await createDebugSession(`
algoritmo "Passos"
var
  x: inteiro
inicio
  x <- 1
  x <- x + 1
  escreval(x)
fimalgoritmo
`);

  assert.equal(session.current().index, 0);
  assert.equal(session.next().index, 1);
  assert.equal(session.next().index, 2);
  assert.equal(session.previous().index, 1);
  assert.equal(session.stop().active, false);
});

test('creates an interactive debug session that advances execution on demand', async () => {
  let readCalled = false;
  const session = createInteractiveDebugSession(`
algoritmo "DebugVivo"
var
  nome: caracter
inicio
  leia(nome)
  escreval(nome)
fimalgoritmo
`, {
    async onRead() {
      readCalled = true;
      return 'Bia';
    }
  });

  const first = await session.current();
  assert.equal(first.step.statement, 'read');
  assert.equal(first.step.phase, 'before');
  assert.equal(readCalled, false);

  const second = await session.next();
  assert.equal(second.step.statement, 'read');
  assert.equal(second.step.phase, 'after');
  assert.equal(readCalled, true);

  const third = await session.next();
  assert.equal(third.step.statement, 'writeLine');
  assert.equal(third.step.phase, 'before');
  assert.deepEqual(third.step.variables, { nome: 'Bia' });
});

test('interactive debug session starts at first breakpoint when provided', async () => {
  const session = createInteractiveDebugSession(`
algoritmo "DebugVivoBreakpoint"
var
  x: inteiro
inicio
  x <- 1
  x <- 2
  escreval(x)
fimalgoritmo
`, { breakpoints: [7] });

  const first = await session.current();
  assert.equal(first.step.line, 7);
  assert.equal(first.step.detail, 'x <- 2');
});

test('interactive debug session continues to next breakpoint or finish', async () => {
  const session = createInteractiveDebugSession(`
algoritmo "DebugContinuar"
var
  x: inteiro
inicio
  x <- 1
  x <- 2
  x <- 3
  escreval(x)
fimalgoritmo
`, { breakpoints: [6, 8] });

  const first = await session.current();
  assert.equal(first.step.line, 6);

  const second = await session.continueExecution();
  assert.equal(second.step.line, 8);
  assert.equal(second.step.detail, 'x <- 3');

  const finished = await session.continueExecution();
  assert.equal(finished.active, false);
  assert.deepEqual(finished.output, ['3']);
});

test('interactive debug session navigates to breakpoint snapshots instead of adjacent steps', async () => {
  const session = createInteractiveDebugSession(`
algoritmo "DebugBreakpointNavigation"
var
  x: inteiro
inicio
  x <- 1
  x <- 2
  x <- 3
fimalgoritmo
`, { breakpoints: [6, 8] });

  const first = await session.current();
  assert.equal(first.step.line, 6);

  const second = await session.continueExecution();
  assert.equal(second.step.line, 8);
  assert.equal(second.step.phase, 'before');

  const afterSecond = await session.next();
  assert.equal(afterSecond.step.line, 8);
  assert.equal(afterSecond.step.phase, 'after');

  const previousBreakpoint = await session.previousBreakpoint();
  assert.equal(previousBreakpoint.step.line, 8);
  assert.equal(previousBreakpoint.step.phase, 'before');

  const firstBreakpoint = await session.previousBreakpoint();
  assert.equal(firstBreakpoint.step.line, 6);
  assert.equal(firstBreakpoint.step.phase, 'before');
});

test('starts debug session at first matching breakpoint line', async () => {
  const session = await createDebugSession(`
algoritmo "DebugBreakpoint"
var
  x: inteiro
inicio
  x <- 1
  x <- 2
  escreval(x)
fimalgoritmo
`, { breakpoints: [7] });

  assert.equal(session.current().step.line, 7);
  assert.equal(session.current().step.detail, 'x <- 2');
});

test('starts debug session at next executable line after breakpoint', async () => {
  const session = await createDebugSession(`
algoritmo "DebugBreakpointProximo"
var
  x: inteiro
inicio
  x <- 1
  // comentario usado como linha nao executavel
  x <- 2
  escreval(x)
fimalgoritmo
`, { breakpoints: [7] });

  assert.equal(session.current().step.line, 8);
  assert.equal(session.current().step.detail, 'x <- 2');
});

test('evaluates watch expressions against debug snapshots', async () => {
  const session = await createDebugSession(`
algoritmo "Watch"
var
  notas: vetor[1..3] de inteiro
  meio, baixo, alto: inteiro
inicio
  notas[1] <- 10
  notas[2] <- 20
  notas[3] <- 30
  baixo <- 1
  alto <- 3
  meio <- 2
fimalgoritmo
`, { breakpoints: [12] });

  const snapshot = session.next();

  assert.equal(await evaluateWatchExpression(snapshot, 'baixo + alto'), 4);
  assert.equal(await evaluateWatchExpression(snapshot, 'notas[meio]'), 20);
  assert.equal(await evaluateWatchExpression(snapshot, 'baixo <= meio'), true);
});

test('navigates between breakpoint snapshots', async () => {
  const session = await createDebugSession(`
algoritmo "DebugBreakpoints"
var
  x: inteiro
inicio
  x <- 1
  x <- 2
  x <- 3
fimalgoritmo
`, { breakpoints: [6, 8] });

  assert.equal(session.current().step.line, 6);
  assert.equal(session.nextBreakpoint().step.line, 8);
  assert.equal(session.previousBreakpoint().step.line, 6);
});

test('reports whether debug session has breakpoint navigation', async () => {
  const source = `
algoritmo "SemBreakpoint"
var
  x: inteiro
inicio
  x <- 1
  x <- 2
fimalgoritmo
`;

  const withoutBreakpoints = await createDebugSession(source);
  const withBreakpoint = await createDebugSession(source, { breakpoints: [6] });
  const withBreakpoints = await createDebugSession(source, { breakpoints: [6, 7] });

  assert.equal(withoutBreakpoints.current().hasBreakpoints, false);
  assert.equal(withoutBreakpoints.current().hasMultipleBreakpoints, false);
  assert.equal(withoutBreakpoints.current().breakpointCount, 0);
  assert.equal(withBreakpoint.current().hasBreakpoints, true);
  assert.equal(withBreakpoint.current().hasMultipleBreakpoints, false);
  assert.equal(withBreakpoint.current().breakpointCount, 1);
  assert.equal(withBreakpoints.current().hasBreakpoints, true);
  assert.equal(withBreakpoints.current().hasMultipleBreakpoints, true);
  assert.equal(withBreakpoints.current().breakpointCount, 2);
});

test('rejects JavaScript-only expression syntax', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "ExpressaoInvalida"
var
  x: inteiro
inicio
  x <- (1, 2)
fimalgoritmo
`),
    /Erro ao avaliar "\(1, 2\)"/
  );
});

test('suggests similar command names for unsupported statements', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "Sugestao"
inicio
  escrevla("oi")
fimalgoritmo
`),
    /Voce quis dizer "escreva"\?/
  );
});

test('reports unmatched subprogram end commands clearly', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "FimSolto"
inicio
  fimprocedimento
fimalgoritmo
`),
    /Linha 4: fimprocedimento sem procedimento aberto/
  );
});

test('reports source line when a statement fails', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "ErroLinha"
var
  notas: vetor[1..2] de inteiro
inicio
  notas[3] <- 10
fimalgoritmo
`),
    /Linha 6: Indice 3 fora do intervalo de notas\[1\.\.2\]\./
  );
});

test('executes repita ate loops', async () => {
  const result = await runVisualg(`
algoritmo "Repita"
var
  i: inteiro
inicio
  i <- 1
  repita
    escreval(i)
    i <- i + 1
  ate i > 3
fimalgoritmo
`);

  assert.deepEqual(result.output, ['1', '2', '3']);
});

test('executes escolha caso branches', async () => {
  const result = await runVisualg(`
algoritmo "Escolha"
var
  opcao: inteiro
inicio
  opcao <- 2
  escolha opcao
    caso 1
      escreval("um")
    caso 2
      escreval("dois")
    outrocaso
      escreval("outro")
  fimescolha
fimalgoritmo
`);

  assert.deepEqual(result.output, ['dois']);
});

test('executes escolha caso range branches', async () => {
  const result = await runVisualg(`
algoritmo "EscolhaRange"
var
  opcao: inteiro
inicio
  opcao <- 4
  escolha opcao
    caso 1..3
      escreval("baixo")
    caso 4..6
      escreval("medio")
    outrocaso
      escreval("outro")
  fimescolha
fimalgoritmo
`);

  assert.deepEqual(result.output, ['medio']);
});

test('supports two-dimensional vetor declarations', async () => {
  const result = await runVisualg(`
algoritmo "Matriz"
var
  tabela: vetor[1..2, 1..2] de inteiro
inicio
  tabela[1, 1] <- 2
  tabela[1, 2] <- 3
  tabela[2, 1] <- tabela[1, 1] + tabela[1, 2]
  escreval(tabela[2, 1])
fimalgoritmo
`);

  assert.deepEqual(result.output, ['5']);
});

test('rejects unknown declaration types', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "TipoInvalido"
var
  nome: seila
inicio
  escreval(nome)
fimalgoritmo
`),
    /Linha 4: Tipo desconhecido: seila/
  );
});

test('rejects malformed declarations inside var block', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "DeclaracaoInvalida"
var
  nome caracter
inicio
  escreval(nome)
fimalgoritmo
`),
    /Linha 4: Declaracao invalida: nome caracter/
  );
});

test('rejects invalid numeric input instead of coercing to zero', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "EntradaInvalida"
var
  idade: inteiro
inicio
  leia(idade)
fimalgoritmo
`, { input: ['abc'] }),
    /Valor invalido para inteiro: abc/
  );
});

test('rejects invalid logical input instead of coercing to false', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "LogicoInvalido"
var
  ativo: logico
inicio
  leia(ativo)
fimalgoritmo
`, { input: ['talvez'] }),
    /Valor invalido para logico: talvez/
  );
});

test('initializes declared integer vectors with default zero values', async () => {
  const result = await runVisualg(`
algoritmo "VetorInicializado"
var
  notas: vetor[1..3] de inteiro
inicio
  escreval(notas[1])
  escreval(notas[2])
  escreval(notas[3])
fimalgoritmo
`);

  assert.deepEqual(result.output, ['0', '0', '0']);
});

test('fills vectors dynamically with loop index assignments', async () => {
  const result = await runVisualg(`
algoritmo "VetorDinamico"
var
  notas: vetor[1..10] de inteiro
  i: inteiro
inicio
  para i de 1 ate 10 faca
    notas[i] <- i
  fimpara
  escreval(notas[1])
  escreval(notas[10])
fimalgoritmo
`);

  assert.deepEqual(result.output, ['1', '10']);
});

test('evaluates basic native functions', async () => {
  const result = await runVisualg(`
algoritmo "Funcoes"
var
  texto: caracter
inicio
  texto <- "abc"
  escreval(abs(-5))
  escreval(raizq(9))
  escreval(compr(texto))
  escreval(maiusc(texto))
fimalgoritmo
`);

  assert.deepEqual(result.output, ['5', '3', '3', 'ABC']);
});

test('evaluates additional math and string native functions', async () => {
  const result = await runVisualg(`
algoritmo "FuncoesExtras"
inicio
  escreval(int(4.8))
  escreval(quad(3))
  escreval(pi())
  escreval(tan(0))
  escreval(copia("abcdef", 2, 3))
  escreval(pos("cd", "abcdef"))
  escreval(asc("A"))
  escreval(carac(65))
fimalgoritmo
`);

  assert.deepEqual(result.output, ['4', '9', String(Math.PI), '0', 'bcd', '3', '65', 'A']);
});

test('evaluates compatibility native functions for trigonometry and conversions', async () => {
  const result = await runVisualg(`
algoritmo "FuncoesCompatibilidade"
inicio
  escreval(arcsen(0))
  escreval(arccos(1))
  escreval(cotan(1):1:3)
  escreval(caracpnum("123") + 7)
  escreval(numpcarac(42))
fimalgoritmo
`);

  assert.deepEqual(result.output, ['0', '0', '0.642', '130', '42']);
});

test('formats escreva arguments with width and decimals', async () => {
  const result = await runVisualg(`
algoritmo "Formatacao"
var
  valor: real
inicio
  valor <- 3.14159
  escreval(valor:6:2)
  escreval("X":4)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['  3.14', '   X']);
});

test('executes limpatela by clearing previous output', async () => {
  const result = await runVisualg(`
algoritmo "Limpa"
inicio
  escreval("antes")
  limpatela
  escreval("depois")
fimalgoritmo
`);

  assert.deepEqual(result.output, ['depois']);
});

test('executes Visualg utility commands without breaking output flow', async () => {
  const result = await runVisualg(`
algoritmo "Utilitarios"
inicio
  eco off
  timer on
  cronometro
  pausa
  timer off
  eco on
  escreval("ok")
fimalgoritmo
`, { timerDelay: 0 });

  assert.deepEqual(result.output, ['ok']);
});

test('uses aleatorio mode to provide numeric leia values', async () => {
  let requested = false;
  const result = await runVisualg(`
algoritmo "Aleatorio"
var
  n: inteiro
inicio
  aleatorio 4, 4
  leia(n)
  aleatorio off
  escreval(n)
fimalgoritmo
`, {
    async onRead() {
      requested = true;
      return '99';
    }
  });

  assert.equal(requested, false);
  assert.deepEqual(result.output, ['4']);
});

test('executes procedure calls with value parameters', async () => {
  const result = await runVisualg(`
algoritmo "Procedimento"

procedimento saudacao(nome: caracter)
inicio
  escreval("Ola, ", nome)
fimprocedimento

inicio
  saudacao("Elvis")
fimalgoritmo
`);

  assert.deepEqual(result.output, ['Ola, Elvis']);
});

test('evaluates user functions inside expressions', async () => {
  const result = await runVisualg(`
algoritmo "Funcao"

funcao dobro(x: inteiro): inteiro
inicio
  retorne x * 2
fimfuncao

inicio
  escreval(dobro(4) + 1)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['9']);
});

test('keeps procedure parameters and locals scoped to the subprogram', async () => {
  const result = await runVisualg(`
algoritmo "Escopo"

procedimento altera(x: inteiro)
var
  local: inteiro
inicio
  local <- 99
  x <- local
fimprocedimento

var
  x: inteiro
inicio
  x <- 1
  altera(x)
  escreval(x)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['1']);
});

test('supports procedure parameters passed by reference with var', async () => {
  const result = await runVisualg(`
algoritmo "Referencia"

procedimento incrementa(var valor: inteiro)
inicio
  valor <- valor + 1
fimprocedimento

var
  numero: inteiro
inicio
  numero <- 4
  incrementa(numero)
  escreval(numero)
fimalgoritmo
`);

  assert.deepEqual(result.output, ['5']);
});

test('supports vector item parameters passed by reference with var', async () => {
  const result = await runVisualg(`
algoritmo "ReferenciaVetor"

procedimento troca(var a: inteiro, var b: inteiro)
var
  temp: inteiro
inicio
  temp <- a
  a <- b
  b <- temp
fimprocedimento

var
  notas: vetor[1..2] de inteiro
inicio
  notas[1] <- 7
  notas[2] <- 9
  troca(notas[1], notas[2])
  escreval(notas[1], "-", notas[2])
fimalgoritmo
`);

  assert.deepEqual(result.output, ['9-7']);
});

test('supports full vector parameters passed by reference with var', async () => {
  const result = await runVisualg(`
algoritmo "ReferenciaVetorCompleto"

procedimento preencher(var notas: vetor[1..3] de inteiro)
inicio
  notas[1] <- 10
  notas[2] <- 20
  notas[3] <- 30
fimprocedimento

var
  notas: vetor[1..3] de inteiro
inicio
  preencher(notas)
  escreval(notas[1], "-", notas[2], "-", notas[3])
fimalgoritmo
`);

  assert.deepEqual(result.output, ['10-20-30']);
});

test('rejects full vector var parameters with incompatible dimensions', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "ReferenciaVetorDimensaoInvalida"

procedimento preencher(var notas: vetor[1..3] de inteiro)
inicio
  notas[1] <- 10
fimprocedimento

var
  notas: vetor[1..2] de inteiro
inicio
  preencher(notas)
fimalgoritmo
`),
    /Parametro var notas esperava vetor\[1\.\.3\] de inteiro, recebeu vetor\[1\.\.2\] de inteiro/
  );
});

test('rejects expressions passed to var parameters', async () => {
  await assert.rejects(
    () => runVisualg(`
algoritmo "ReferenciaInvalida"

procedimento incrementa(var valor: inteiro)
inicio
  valor <- valor + 1
fimprocedimento

inicio
  incrementa(1 + 2)
fimalgoritmo
`),
    /Parametro var valor deve receber uma variavel ou item de vetor/
  );
});

test('supports recursive user functions', async () => {
  const result = await runVisualg(`
algoritmo "Recursao"

funcao fatorial(n: inteiro): inteiro
inicio
  se n <= 1 entao
    retorne 1
  fimse
  retorne n * fatorial(n - 1)
fimfuncao

inicio
  escreval(fatorial(5))
fimalgoritmo
`);

  assert.deepEqual(result.output, ['120']);
});

test('collects leia variables from parsed statements', () => {
  const variables = collectReadVariables(`
algoritmo "Leituras"
var
  nome: caracter
  opcao: inteiro
inicio
  leia(nome) // comentario
  se nome <> "" entao
    leia(opcao)
  fimse
fimalgoritmo
`);

  assert.deepEqual(variables, ['nome', 'opcao']);
});

test('parses and executes arquivo command, reading from onReadFile', async () => {
  // Test parser
  const ast = parseVisualg(`
algoritmo "TesteArquivo"
inicio
  arquivo "teste_dados.txt"
fimalgoritmo
`);
  const stmt = ast.statements[0];
  assert.equal(stmt.type, 'inputFileCommand');
  assert.equal(stmt.path, 'teste_dados.txt');

  // Test runtime
  const result = await runVisualg(`
algoritmo "TesteArquivoRuntime"
var
  n: inteiro
  s: caracter
inicio
  arquivo "teste_dados.txt"
  leia(n)
  leia(s)
  escreval(n, " - ", s)
fimalgoritmo
`, {
    onReadFile(filePath) {
      assert.equal(filePath, 'teste_dados.txt');
      return "42\nbanana";
    }
  });

  assert.deepEqual(result.output, ['42 - banana']);
});

test('supports debug on/off commands in headless execution', async () => {
  const result = await runVisualg(`
algoritmo "DebugComando"
inicio
  debug on
  escreval("registrado")
  debug off
  escreval("fora")
fimalgoritmo
`);

  assert.deepEqual(result.output, ['registrado', 'fora']);
  assert.ok(result.steps.some((step) => step.detail.includes('writeLine("registrado")')));
  assert.ok(!result.steps.some((step) => step.detail.includes('writeLine("fora")')));
});

test('supports pausa through the read bridge', async () => {
  const requests = [];
  const result = await runVisualg(`
algoritmo "Pausa"
inicio
  escreval("antes")
  pausa
  escreval("depois")
fimalgoritmo
`, {
    onRead(request) {
      requests.push(request);
      return '';
    }
  });

  assert.deepEqual(result.output, ['antes', 'depois']);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].isPause, true);
});

test('supports aleatorio with decimal ranges for real input', async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    const result = await runVisualg(`
algoritmo "AleatorioReal"
var
  valor: real
inicio
  aleatorio 1.5, 1.7
  leia(valor)
  escreval(valor)
fimalgoritmo
`);

    assert.equal(Number(result.output[0]), 1.6);
  } finally {
    Math.random = originalRandom;
  }
});

test('allows timer delay to be disabled for deterministic execution', async () => {
  const startedAt = Date.now();
  const result = await runVisualg(`
algoritmo "TimerSemEspera"
inicio
  timer on
  escreval("ok")
  timer off
fimalgoritmo
`, { timerDelay: 0 });

  assert.deepEqual(result.output, ['ok']);
  assert.ok(Date.now() - startedAt < 120);
});
