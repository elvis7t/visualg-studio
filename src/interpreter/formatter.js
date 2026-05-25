import { normalizeKeyword } from './tokenizer.js';

const DECREASE_BEFORE = new Set([
  'inicio',
  'fimse',
  'fimpara',
  'fimenquanto',
  'fimescolha',
  'fimprocedimento',
  'fimfuncao',
  'fimalgoritmo'
]);

const INCREASE_AFTER = new Set([
  'var',
  'inicio',
  'repita',
  'senao',
  'outrocaso'
]);

export function formatVisualg(source, { tabSize = 2 } = {}) {
  const indentUnit = ' '.repeat(tabSize);
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let indent = 0;
  const formatted = [];

  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;

    const { code, comment } = splitComment(text);
    const trimmedCode = code.trim();
    const normalized = normalizeKeyword(trimmedCode || comment.trim());
    if (normalized === 'fimescolha') indent = Math.max(0, indent - 2);
    else if (shouldDecreaseBefore(normalized)) indent = Math.max(0, indent - 1);
    if (normalized === 'senao' || normalized === 'outrocaso') {
      indent = Math.max(0, indent - 1);
    }

    formatted.push(`${indentUnit.repeat(indent)}${formatLine(trimmedCode, comment)}`);

    if (shouldIncreaseAfter(normalized)) indent += 1;
  }

  return formatted.join('\n');
}

function splitComment(line) {
  let inString = false;
  for (let index = 0; index < line.length - 1; index += 1) {
    const char = line[index];
    if (char === '"') inString = !inString;
    if (!inString && char === '/' && line[index + 1] === '/') {
      return {
        code: line.slice(0, index),
        comment: line.slice(index).trim()
      };
    }
  }
  return { code: line, comment: '' };
}

function formatLine(code, comment) {
  if (!code) return comment;
  if (!comment) return code;
  return `${code} ${comment}`;
}

function shouldDecreaseBefore(normalized) {
  return DECREASE_BEFORE.has(normalized) || normalized.startsWith('ate ');
}

function shouldIncreaseAfter(normalized) {
  if (INCREASE_AFTER.has(normalized)) return true;
  if (normalized.startsWith('algoritmo ')) return false;
  if (normalized.startsWith('procedimento ') || normalized.startsWith('funcao ')) return false;
  if (normalized.startsWith('se ') && normalized.endsWith(' entao')) return true;
  if (normalized.startsWith('para ') && normalized.endsWith(' faca')) return true;
  if (normalized.startsWith('enquanto ') && normalized.endsWith(' faca')) return true;
  if (normalized.startsWith('escolha ')) return true;
  if (normalized.startsWith('caso ')) return true;
  return false;
}
