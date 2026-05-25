export function createDebugStep(statement, phase, runtime) {
  return {
    phase,
    statement: statement.type,
    line: statement.line ?? null,
    detail: statementDetail(statement),
    variables: runtime.snapshotVariables(),
    variableTypes: runtime.snapshotVariableTypes(),
    output: [...runtime.output, ...(runtime.currentLine ? [runtime.currentLine] : [])]
  };
}

function statementDetail(statement) {
  if (statement.type === 'assign') return `${statement.target ?? statement.name} <- ${statement.expression}`;
  if (statement.type === 'write' || statement.type === 'writeLine') return `${statement.type}(${statement.args.join(', ')})`;
  if (statement.type === 'read') return `leia(${statement.names.join(', ')})`;
  if (statement.type === 'clearScreen') return 'limpatela';
  if (statement.type === 'pause') return 'pausa';
  if (statement.type === 'timer') return `timer ${statement.mode}`;
  if (statement.type === 'chronometer') return 'cronometro';
  if (statement.type === 'echo') return `eco ${statement.mode}`;
  if (statement.type === 'randomMode') return statement.mode === 'range' ? `aleatorio ${statement.min}, ${statement.max}` : `aleatorio ${statement.mode}`;
  if (statement.type === 'break') return 'interrompa';
  if (statement.type === 'return') return `retorne ${statement.expression}`;
  if (statement.type === 'procedureCall') return `${statement.name}(${statement.args.join(', ')})`;
  if (statement.type === 'if') return `se ${statement.condition}`;
  if (statement.type === 'for') return `para ${statement.variable}`;
  if (statement.type === 'while') return `enquanto ${statement.condition}`;
  if (statement.type === 'repeat') return `repita ate ${statement.condition}`;
  if (statement.type === 'choice') return `escolha ${statement.expression}`;
  return statement.type;
}
