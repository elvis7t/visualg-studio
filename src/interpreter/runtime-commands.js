import { configureRandomMode, nextInput } from './execution-state.js';

export async function executeUtilityStatement(runtime, statement) {
  if (statement.type === 'clearScreen') {
    runtime.output = [];
    runtime.currentLine = '';
    return true;
  }

  if (statement.type === 'pause') {
    await nextInput(runtime.executionState, { name: '[pausa]', line: statement.line, isPause: true });
    return true;
  }

  if (statement.type === 'timer') {
    runtime.timerEnabled = statement.mode === 'on';
    runtime.timerStartedAt = runtime.timerEnabled ? Date.now() : null;
    return true;
  }

  if (statement.type === 'chronometer') {
    if (runtime.chronometerStartedAt == null) {
      runtime.chronometerStartedAt = Date.now();
    } else {
      const elapsed = (Date.now() - runtime.chronometerStartedAt) / 1000;
      runtime.chronometerStartedAt = null;
      runtime.currentLine += `[Cronômetro: ${elapsed.toFixed(2)}s]`;
      runtime.flushLine(true);
    }
    return true;
  }

  if (statement.type === 'echo') {
    runtime.echo = statement.mode === 'on';
    return true;
  }

  if (statement.type === 'randomMode') {
    await configureRandomMode(runtime.executionState, statement, (expression) => runtime.evaluate(expression));
    return true;
  }

  if (statement.type === 'inputFileCommand') {
    let content = '';
    if (typeof runtime.options?.onReadFile === 'function') {
      content = await runtime.options.onReadFile(statement.path);
    } else {
      try {
        const fs = await import('fs');
        content = fs.readFileSync(statement.path, 'utf8');
      } catch (err) {
        throw new Error(`Nao foi possivel ler o arquivo de entrada: ${statement.path}. Detalhes: ${err.message}`);
      }
    }
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    runtime.executionState.input.push(...lines);
    return true;
  }

  if (statement.type === 'debug') {
    runtime.debug = statement.mode === 'on';
    return true;
  }

  return false;
}
