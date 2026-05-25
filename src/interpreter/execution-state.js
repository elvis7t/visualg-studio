const DEFAULT_LOOP_GUARD_LIMIT = 100000;

export function createExecutionState(options = {}) {
  return {
    input: [...(options.input ?? [])],
    onRead: typeof options.onRead === 'function' ? options.onRead : null,
    randomMode: null,
    loopGuardLimit: options.detectInfiniteLoop === false ? Infinity : (options.loopGuardLimit ?? DEFAULT_LOOP_GUARD_LIMIT)
  };
}

export async function nextInput(state, request) {
  if (state.input.length > 0) return state.input.shift();
  if (request?.isPause) {
    if (state.onRead) return state.onRead(request);
    return '';
  }
  if (!state.randomMode && state.onRead) return state.onRead(request);
  if (!state.randomMode) return '';

  const type = String(request?.type ?? 'inteiro').toLowerCase();
  if (type === 'logico') {
    return Math.random() < 0.5 ? 'verdadeiro' : 'falso';
  }
  if (type === 'caracter' || type === 'caractere') {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  if (type === 'real') {
    const { min, max } = state.randomMode;
    const val = Math.random() * (max - min) + min;
    return String(val.toFixed(2));
  }

  const min = Math.ceil(state.randomMode.min);
  const max = Math.floor(state.randomMode.max);
  if (min > max) throw new Error('Intervalo de aleatorio nao contem valores inteiros.');
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export async function configureRandomMode(state, statement, evaluate) {
  if (statement.mode === 'off') {
    state.randomMode = null;
    return;
  }

  const min = Number(await evaluate(statement.min));
  const max = Number(await evaluate(statement.max));
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('Intervalo de aleatorio invalido.');
  state.randomMode = {
    min: Math.min(min, max),
    max: Math.max(min, max)
  };
}

export function assertLoopGuard(state, count, loopName) {
  if (count > state.loopGuardLimit) {
    throw new Error(`Loop ${loopName} excedeu o limite de seguranca.`);
  }
}
