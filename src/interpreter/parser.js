import { normalizeKeyword, sourceRecords, splitArguments } from './tokenizer.js';
import { BUILTINS, COMPLETION_KEYWORDS, TYPE_SET } from './lexicon.js';

export function parseVisualg(source) {
  const lines = sourceRecords(source);
  const { topLevelLines, subprograms } = extractSubprograms(lines);
  const declarations = parseDeclarations(topLevelLines);
  const start = topLevelLines.findIndex((line) => normalizeKeyword(line.text) === 'inicio');
  const end = topLevelLines.findIndex((line) => normalizeKeyword(line.text) === 'fimalgoritmo');

  if (start < 0) throw new Error('Bloco "inicio" nao encontrado.');
  if (end < 0) throw new Error('Bloco "fimalgoritmo" nao encontrado.');

  const executable = topLevelLines.slice(start + 1, end);
  const { statements } = parseBlock(executable, 0, new Set());

  return { declarations, statements, subprograms };
}

function extractSubprograms(lines) {
  const topLevelLines = [];
  const subprograms = [];

  for (let index = 0; index < lines.length; index += 1) {
    const normalized = normalizeKeyword(lines[index].text);
    if (normalized.startsWith('procedimento ') || normalized.startsWith('funcao ')) {
      const parsed = parseSubprogram(lines, index);
      subprograms.push(parsed.subprogram);
      index = parsed.endIndex;
      continue;
    }

    topLevelLines.push(lines[index]);
  }

  return { topLevelLines, subprograms };
}

function parseSubprogram(lines, startIndex) {
  const header = lines[startIndex];
  const normalized = normalizeKeyword(header.text);
  const kind = normalized.startsWith('procedimento ') ? 'procedure' : 'function';
  const endKeyword = kind === 'procedure' ? 'fimprocedimento' : 'fimfuncao';
  const endIndex = lines.findIndex((line, index) => index > startIndex && normalizeKeyword(line.text) === endKeyword);

  if (endIndex < 0) throw new Error(`Linha ${header.line}: Subprograma sem ${endKeyword}.`);

  const subprogram = kind === 'procedure'
    ? parseProcedureHeader(header)
    : parseFunctionHeader(header);
  const bodyLines = lines.slice(startIndex + 1, endIndex);
  const bodyStart = bodyLines.findIndex((line) => normalizeKeyword(line.text) === 'inicio');
  if (bodyStart < 0) throw new Error(`Linha ${header.line}: Subprograma sem inicio.`);

  subprogram.declarations = parseDeclarations(bodyLines);
  subprogram.statements = parseBlock(bodyLines.slice(bodyStart + 1), 0, new Set()).statements;

  return { subprogram, endIndex };
}

function parseProcedureHeader(line) {
  const match = line.text.match(/^procedimento\s+([a-zA-Z_][\w]*)\s*(?:\((.*)\))?\s*$/i);
  if (!match) throw new Error(`Linha ${line.line}: Cabecalho de procedimento invalido: ${line.text}`);

  return {
    kind: 'procedure',
    name: match[1],
    params: parseParameters(match[2] ?? '', line),
    declarations: [],
    statements: [],
    line: line.line
  };
}

function parseFunctionHeader(line) {
  const match = line.text.match(/^fun[cç][aã]o\s+([a-zA-Z_][\w]*)\s*(?:\((.*)\))?\s*:\s*([a-zA-Z\u00C0-\u017F]+)\s*$/i);
  if (!match) throw new Error(`Linha ${line.line}: Cabecalho de funcao invalido: ${line.text}`);

  const returnType = normalizeKeyword(match[3]);
  assertKnownType(returnType, line);
  return {
    kind: 'function',
    name: match[1],
    params: parseParameters(match[2] ?? '', line),
    returnType,
    declarations: [],
    statements: [],
    line: line.line
  };
}

function parseParameters(text, line) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const colonCount = (trimmed.match(/:/g) ?? []).length;
  const groups = trimmed.includes(';')
    ? trimmed.split(';').map((part) => part.trim()).filter(Boolean)
    : colonCount > 1
      ? splitArguments(trimmed)
      : [trimmed];

  return groups.flatMap((part) => {
    const parameter = parseParameter(part, line);
    return parameter.names.map((name) => ({
      name: name.trim(),
      type: parameter.type,
      vector: parameter.vector,
      byReference: parameter.byReference
    }));
  });
}

function parseParameter(part, line) {
  const vectorMatch = part.match(/^(.+?)\s*:\s*vetor\s*\[\s*(.+?)\s*\]\s*de\s*([a-zA-Z\u00C0-\u017F]+)\s*$/i);
  if (vectorMatch) {
    const byReference = /^\s*var\s+/i.test(vectorMatch[1]);
    const names = byReference ? vectorMatch[1].replace(/^\s*var\s+/i, '') : vectorMatch[1];
    const itemType = normalizeKeyword(vectorMatch[3]);
    assertKnownType(itemType, line);
    const dimensions = parseVectorDimensions(vectorMatch[2], line, part);
    return {
      names: names.split(','),
      type: itemType,
      vector: {
        start: dimensions[0].start,
        end: dimensions[0].end,
        dimensions
      },
      byReference
    };
  }

  const match = part.match(/^(.+?)\s*:\s*([a-zA-Z\u00C0-\u017F]+)\s*$/);
  if (!match) throw new Error(`Linha ${line.line}: Parametro invalido: ${part}`);
  const byReference = /^\s*var\s+/i.test(match[1]);
  const names = byReference ? match[1].replace(/^\s*var\s+/i, '') : match[1];
  const type = normalizeKeyword(match[2]);
  assertKnownType(type, line);
  return { names: names.split(','), type, vector: null, byReference };
}

function parseDeclarations(lines) {
  const declarations = [];
  const varIndex = lines.findIndex((line) => normalizeKeyword(line.text) === 'var');
  const startIndex = lines.findIndex((line) => normalizeKeyword(line.text) === 'inicio');

  if (varIndex < 0 || startIndex < 0 || startIndex <= varIndex) return declarations;

  for (const line of lines.slice(varIndex + 1, startIndex)) {
    const vectorMatch = line.text.match(/^(.+?)\s*:\s*vetor\s*\[\s*(.+?)\s*\]\s*de\s*([a-zA-Z\u00C0-\u017F]+)\s*$/i);
    if (vectorMatch) {
      const itemType = normalizeKeyword(vectorMatch[3]);
      assertKnownType(itemType, line);
      const dimensions = parseVectorDimensions(vectorMatch[2], line, line.text);
      for (const name of vectorMatch[1].split(',')) {
        declarations.push({
          name: name.trim(),
          type: itemType,
          vector: {
            start: dimensions[0].start,
            end: dimensions[0].end,
            dimensions
          }
        });
      }
      continue;
    }

    const match = line.text.match(/^(.+?)\s*:\s*([a-zA-Z\u00C0-\u017F]+)\s*$/);
    if (!match) throw new Error(`Linha ${line.line}: Declaracao invalida: ${line.text}`);
    const type = normalizeKeyword(match[2]);
    assertKnownType(type, line);

    for (const name of match[1].split(',')) {
      declarations.push({
        name: name.trim(),
        type
      });
    }
  }

  return declarations;
}

function parseVectorDimensions(text, line, sourceText) {
  return text.split(',').map((dimension) => {
    const match = dimension.trim().match(/^(-?\d+)\s*\.\.\s*(-?\d+)$/);
    if (!match) throw new Error(`Linha ${line.line}: Declaracao de vetor invalida: ${sourceText}`);
    return { start: Number(match[1]), end: Number(match[2]) };
  });
}

function assertKnownType(type, line) {
  if (!TYPE_SET.has(type)) {
    throw new Error(`Linha ${line.line}: Tipo desconhecido: ${type}.`);
  }
}

function parseBlock(lines, index, stopWords) {
  const statements = [];
  let i = index;

  while (i < lines.length) {
    const line = lines[i];
    const text = line.text;
    const normalized = normalizeKeyword(text);
    const stop = getStop(normalized, stopWords);

    if (stop) {
      return { statements, index: i, stop };
    }

    if (normalized.startsWith('se ') && normalized.endsWith(' entao')) {
      const condition = text.replace(/^se\s+/i, '').replace(/\s+ent[aã]o$/i, '').trim();
      const thenBlock = parseBlock(lines, i + 1, new Set(['senao', 'fimse']));
      let elseStatements = [];
      let nextIndex = thenBlock.index;

      if (thenBlock.stop === 'senao') {
        const elseBlock = parseBlock(lines, thenBlock.index + 1, new Set(['fimse']));
        elseStatements = elseBlock.statements;
        nextIndex = elseBlock.index;
      }

      statements.push({ type: 'if', condition, thenStatements: thenBlock.statements, elseStatements, line: line.line });
      i = nextIndex + 1;
      continue;
    }

    if (normalized.startsWith('para ')) {
      const match = text.match(/^para\s+([a-zA-Z_][\w]*)\s+de\s+(.+?)\s+ate\s+(.+?)(?:\s+passo\s+(.+?))?\s+faca$/i);
      if (!match) throw new Error(`Linha ${line.line}: Comando para invalido: ${text}`);

      const body = parseBlock(lines, i + 1, new Set(['fimpara']));
      statements.push({
        type: 'for',
        variable: match[1],
        start: match[2].trim(),
        end: match[3].trim(),
        step: match[4]?.trim() ?? '1',
        statements: body.statements,
        line: line.line
      });
      i = body.index + 1;
      continue;
    }

    if (normalized.startsWith('enquanto ')) {
      const match = text.match(/^enquanto\s+(.+)\s+faca$/i);
      if (!match) throw new Error(`Linha ${line.line}: Comando enquanto invalido: ${text}`);

      const body = parseBlock(lines, i + 1, new Set(['fimenquanto']));
      statements.push({ type: 'while', condition: match[1].trim(), statements: body.statements, line: line.line });
      i = body.index + 1;
      continue;
    }

    if (normalized === 'repita') {
      const body = parseBlock(lines, i + 1, new Set(['ate']));
      const endLine = lines[body.index];
      if (!endLine || !normalizeKeyword(endLine.text).startsWith('ate ')) {
        throw new Error(`Linha ${line.line}: Bloco repita sem ate.`);
      }

      statements.push({
        type: 'repeat',
        condition: endLine.text.replace(/^ate\s+/i, '').trim(),
        statements: body.statements,
        line: line.line
      });
      i = body.index + 1;
      continue;
    }

    if (normalized.startsWith('escolha ')) {
      const choice = parseChoice(lines, i);
      statements.push(choice.statement);
      i = choice.index + 1;
      continue;
    }

    statements.push(parseStatement(text, line.line));
    i += 1;
  }

  return { statements, index: i, stop: null };
}

function getStop(normalized, stopWords) {
  if (stopWords.has(normalized)) return normalized;
  if (stopWords.has('ate') && normalized.startsWith('ate ')) return 'ate';
  if (stopWords.has('caso') && normalized.startsWith('caso ')) return 'caso';
  return null;
}

function parseChoice(lines, index) {
  const line = lines[index];
  const expression = line.text.replace(/^escolha\s+/i, '').trim();
  const cases = [];
  let defaultStatements = [];
  let i = index + 1;

  while (i < lines.length) {
    const current = lines[i];
    const normalized = normalizeKeyword(current.text);

    if (normalized === 'fimescolha') {
      return {
        statement: { type: 'choice', expression, cases, defaultStatements, line: line.line },
        index: i
      };
    }

    if (normalized.startsWith('caso ')) {
      const expressions = current.text
        .replace(/^caso\s+/i, '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const body = parseBlock(lines, i + 1, new Set(['caso', 'outrocaso', 'fimescolha']));
      cases.push({ expressions, statements: body.statements, line: current.line });
      i = body.index;
      continue;
    }

    if (normalized === 'outrocaso') {
      const body = parseBlock(lines, i + 1, new Set(['fimescolha']));
      defaultStatements = body.statements;
      i = body.index;
      continue;
    }

    throw new Error(`Linha ${current.line}: Comando escolha invalido: ${current.text}`);
  }

  throw new Error(`Linha ${line.line}: Bloco escolha sem fimescolha.`);
}

function parseStatement(line, lineNumber) {
  const normalized = normalizeKeyword(line);

  if (normalized === 'fimprocedimento') {
    throw new Error(`Linha ${lineNumber}: fimprocedimento sem procedimento aberto.`);
  }

  if (normalized === 'fimfuncao') {
    throw new Error(`Linha ${lineNumber}: fimfuncao sem funcao aberta.`);
  }

  if (normalized.startsWith('escreval')) {
    return { type: 'writeLine', args: parseCallArgs(line, 'escreval'), line: lineNumber };
  }

  if (normalized.startsWith('escreva')) {
    return { type: 'write', args: parseCallArgs(line, 'escreva'), line: lineNumber };
  }

  if (normalized.startsWith('leia')) {
    return { type: 'read', names: parseCallArgs(line, 'leia'), line: lineNumber };
  }

  if (normalized === 'limpatela') {
    return { type: 'clearScreen', line: lineNumber };
  }

  if (normalized === 'pausa') {
    return { type: 'pause', line: lineNumber };
  }

  if (normalized === 'cronometro') {
    return { type: 'chronometer', line: lineNumber };
  }

  if (normalized.startsWith('timer ')) {
    return { type: 'timer', mode: parseOnOffCommand(line, 'timer', lineNumber), line: lineNumber };
  }

  if (normalized.startsWith('eco ')) {
    return { type: 'echo', mode: parseOnOffCommand(line, 'eco', lineNumber), line: lineNumber };
  }

  if (normalized.startsWith('arquivo ')) {
    const rawPath = line.replace(/^arquivo\s+/i, '').trim();
    const pathVal = (rawPath.startsWith('"') && rawPath.endsWith('"')) || (rawPath.startsWith("'") && rawPath.endsWith("'"))
      ? rawPath.slice(1, -1)
      : rawPath;
    return { type: 'inputFileCommand', path: pathVal.trim(), line: lineNumber };
  }

  if (normalized.startsWith('debug ')) {
    return { type: 'debug', mode: parseOnOffCommand(line, 'debug', lineNumber), line: lineNumber };
  }

  if (normalized.startsWith('aleatorio')) {
    return parseRandomCommand(line, lineNumber);
  }

  if (normalized === 'interrompa') {
    return { type: 'break', line: lineNumber };
  }

  if (normalized.startsWith('retorne ')) {
    return { type: 'return', expression: line.replace(/^retorne\s+/i, '').trim(), line: lineNumber };
  }

  const assignment = line.match(/^([a-zA-Z_][\w]*(?:\s*\[.+\])?)\s*(?:<-|:=)\s*(.+)$/);
  if (assignment) {
    return { type: 'assign', target: assignment[1].trim(), name: assignment[1].trim(), expression: assignment[2].trim(), line: lineNumber };
  }

  const procedureCall = line.match(/^([a-zA-Z_][\w]*)\s*\((.*)\)\s*$/);
  if (procedureCall) {
    const args = procedureCall[2].trim() ? splitArguments(procedureCall[2]) : [];
    return { type: 'procedureCall', name: procedureCall[1], args, line: lineNumber };
  }

  throw new Error(`Linha ${lineNumber}: Comando nao suportado: ${line}${suggestCommand(line)}`);
}

function parseOnOffCommand(line, command, lineNumber) {
  const mode = normalizeKeyword(line.replace(new RegExp(`^${command}\\s+`, 'i'), '').trim());
  if (mode !== 'on' && mode !== 'off') {
    throw new Error(`Linha ${lineNumber}: Comando ${command} espera on ou off.`);
  }
  return mode;
}

function parseRandomCommand(line, lineNumber) {
  const rest = line.replace(/^aleatorio/i, '').trim();
  if (!rest) return { type: 'randomMode', mode: 'on', min: '0', max: '1', line: lineNumber };
  const normalized = normalizeKeyword(rest);
  if (normalized === 'on' || normalized === 'off') {
    return { type: 'randomMode', mode: normalized, min: '0', max: '1', line: lineNumber };
  }

  const args = splitArguments(rest);
  if (args.length !== 2) {
    throw new Error(`Linha ${lineNumber}: Comando aleatorio espera on, off ou intervalo minimo,maximo.`);
  }

  return { type: 'randomMode', mode: 'range', min: args[0], max: args[1], line: lineNumber };
}

function parseCallArgs(line, name) {
  const normalizedLine = normalizeKeyword(line);
  if (!normalizedLine.startsWith(name)) throw new Error(`Chamada invalida: ${line}`);

  const rest = line.slice(name.length).trim();
  if (!rest) return [];
  if (!rest.startsWith('(') || !rest.endsWith(')')) throw new Error(`Chamada invalida: ${line}`);

  const inner = rest.slice(1, -1).trim();
  return inner ? splitArguments(inner) : [];
}

function suggestCommand(line) {
  const command = normalizeKeyword(line).match(/^[a-zA-Z_][\w]*/)?.[0];
  if (!command) return '';
  const candidates = [...new Set([...COMPLETION_KEYWORDS, ...BUILTINS])];
  const suggestion = candidates
    .map((candidate) => ({ candidate, distance: levenshtein(command, candidate) }))
    .filter((item) => item.distance <= 2)
    .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))[0];
  return suggestion ? `. Voce quis dizer "${suggestion.candidate}"?` : '';
}

function levenshtein(left, right) {
  const distances = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= right.length; column += 1) distances[0][column] = column;

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + cost
      );
    }
  }

  return distances[left.length][right.length];
}
