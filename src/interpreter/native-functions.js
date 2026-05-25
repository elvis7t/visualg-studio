import { BUILTINS } from './lexicon.js';
import { normalizeKeyword } from './tokenizer.js';

const UNARY_NUMBER_FUNCTIONS = {
  abs: Math.abs,
  raizq: Math.sqrt,
  sen: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  arcsen: Math.asin,
  arccos: Math.acos,
  arctan: Math.atan,
  int: Math.trunc,
  exp: Math.exp,
  log: Math.log10,
  logn: Math.log
};

const NATIVE_FUNCTIONS = {
  ...Object.fromEntries(Object.entries(UNARY_NUMBER_FUNCTIONS).map(([name, fn]) => [
    name,
    { arity: 1, handler: ([value]) => fn(Number(value)) }
  ])),
  cotan: { arity: 1, handler: ([value]) => 1 / Math.tan(Number(value)) },
  quad: { arity: 1, handler: ([value]) => Number(value) ** 2 },
  pi: { arity: 0, handler: () => Math.PI },
  grauprad: { arity: 1, handler: ([value]) => Number(value) * Math.PI / 180 },
  radpgrau: { arity: 1, handler: ([value]) => Number(value) * 180 / Math.PI },
  rand: { arity: 0, handler: () => Math.random() },
  randi: { arity: 1, handler: ([value]) => Math.floor(Math.random() * (Number(value) + 1)) },
  compr: { arity: 1, handler: ([value]) => String(value).length },
  maiusc: { arity: 1, handler: ([value]) => String(value).toUpperCase() },
  minusc: { arity: 1, handler: ([value]) => String(value).toLowerCase() },
  copia: { arity: 3, handler: ([text, start, length]) => String(text).slice(Number(start) - 1, Number(start) - 1 + Number(length)) },
  pos: { arity: 2, handler: ([search, text]) => String(text).indexOf(String(search)) + 1 },
  asc: { arity: 1, handler: ([value]) => String(value).charCodeAt(0) },
  carac: { arity: 1, handler: ([value]) => String.fromCharCode(Number(value)) },
  caracpnum: { arity: 1, handler: ([value]) => Number(value) },
  numpcarac: { arity: 1, handler: ([value]) => String(value) }
};

export function callNativeFunction(name, args) {
  const normalizedName = normalizeKeyword(name);
  const definition = NATIVE_FUNCTIONS[normalizedName];
  if (!definition) throw new Error(`Função não suportada: ${name}. Funções disponíveis: ${BUILTINS.join(', ')}.`);
  assertArity(normalizedName, args, definition.arity);
  return definition.handler(args);
}

export function nativeFunctionNames() {
  return Object.keys(NATIVE_FUNCTIONS);
}

function assertArity(name, args, arity) {
  if (args.length !== arity) throw new Error(`Funcao ${name} esperava ${arity} argumento, recebeu ${args.length}.`);
}
