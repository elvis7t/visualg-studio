export async function formatWriteArgument(argument, runtime) {
  const format = parseWriteFormat(argument);
  const value = await runtime.evaluate(format.expression);
  return applyWriteFormat(value, format);
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'verdadeiro' : 'falso';
  return String(value);
}

function parseWriteFormat(argument) {
  const parts = splitArgumentsByTopLevelColon(argument);
  return {
    expression: parts[0],
    width: parts[1] == null ? null : Number(parts[1]),
    decimals: parts[2] == null ? null : Number(parts[2])
  };
}

function splitArgumentsByTopLevelColon(text) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inString = false;

  for (const char of text) {
    if (char === '"') inString = !inString;
    if (!inString && (char === '(' || char === '[')) depth += 1;
    if (!inString && (char === ')' || char === ']')) depth -= 1;

    if (!inString && depth === 0 && char === ':') {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  parts.push(current.trim());
  return parts;
}

function applyWriteFormat(value, format) {
  let text = format.decimals == null ? formatValue(value) : Number(value).toFixed(format.decimals);
  if (format.width != null && Number.isFinite(format.width)) text = text.padStart(format.width, ' ');
  return text;
}
