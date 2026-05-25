export function stripComment(line) {
  let inString = false;

  for (let i = 0; i < line.length - 1; i += 1) {
    const char = line[i];
    if (char === '"') inString = !inString;
    if (!inString && char === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }

  return line;
}

export function normalizeKeyword(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function splitArguments(text) {
  const args = [];
  let current = '';
  let depth = 0;
  let inString = false;

  for (const char of text) {
    if (char === '"') inString = !inString;
    if (!inString && (char === '(' || char === '[')) depth += 1;
    if (!inString && (char === ')' || char === ']')) depth -= 1;

    if (!inString && depth === 0 && char === ',') {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) args.push(current.trim());
  return args;
}

export function splitStatements(text) {
  const statements = [];
  let current = '';
  let depth = 0;
  let inString = false;

  for (const char of text) {
    if (char === '"') inString = !inString;
    if (!inString && (char === '(' || char === '[')) depth += 1;
    if (!inString && (char === ')' || char === ']')) depth -= 1;

    if (!inString && depth === 0 && char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

export function sourceRecords(source) {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap((line, index) => splitStatements(stripComment(line)).map((text) => ({ text, line: index + 1 })))
    .filter((record) => record.text);
}
