export const TYPES = ['inteiro', 'real', 'caracter', 'caractere', 'logico'];

export const CONTROL_KEYWORDS = [
  'algoritmo',
  'var',
  'inicio',
  'fimalgoritmo',
  'procedimento',
  'fimprocedimento',
  'funcao',
  'fimfuncao',
  'retorne',
  'se',
  'entao',
  'senao',
  'fimse',
  'para',
  'ate',
  'passo',
  'faca',
  'fimpara',
  'enquanto',
  'fimenquanto',
  'repita',
  'fimrepita',
  'escolha',
  'caso',
  'outrocaso',
  'fimescolha',
  'interrompa'
];

export const DECLARATION_KEYWORDS = ['vetor', 'de'];

export const LITERAL_KEYWORDS = ['verdadeiro', 'falso'];

export const OPERATOR_KEYWORDS = ['div', 'mod', 'e', 'ou', 'nao'];

export const BUILTINS = [
  'abs',
  'raizq',
  'sen',
  'cos',
  'tan',
  'arcsen',
  'arccos',
  'arctan',
  'cotan',
  'int',
  'quad',
  'exp',
  'log',
  'logn',
  'pi',
  'grauprad',
  'radpgrau',
  'rand',
  'randi',
  'compr',
  'maiusc',
  'minusc',
  'copia',
  'pos',
  'asc',
  'carac',
  'caracpnum',
  'numpcarac'
];

export const COMPLETION_KEYWORDS = [
  ...CONTROL_KEYWORDS,
  ...TYPES,
  ...DECLARATION_KEYWORDS,
  ...LITERAL_KEYWORDS,
  ...OPERATOR_KEYWORDS,
  'leia',
  'escreva',
  'escreval',
  'limpatela',
  'pausa',
  'eco',
  'timer',
  'cronometro',
  'aleatorio',
  'arquivo',
  'debug'
];

export const TYPE_SET = new Set(TYPES);
