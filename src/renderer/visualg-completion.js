import { BUILTINS, COMPLETION_KEYWORDS } from '../interpreter/lexicon.js';

export function collectDeclaredVariables(source) {
  const varBlock = source.match(/(?:^|\n)\s*var\s*\n([\s\S]*?)(?:^|\n)\s*inicio\b/im);
  if (!varBlock) return [];

  const names = [];
  for (const line of varBlock[1].split(/\r?\n/)) {
    const clean = line.replace(/\/\/.*$/, '').trim();
    const match = clean.match(/^(.+?)\s*:/);
    if (!match) continue;
    for (const name of match[1].split(',')) {
      const trimmed = name.trim();
      if (trimmed && !names.includes(trimmed)) names.push(trimmed);
    }
  }
  return names;
}

export function getVisualgCompletionOptions(source) {
  const variables = collectDeclaredVariables(source).map((label) => ({
    label,
    type: 'variable',
    detail: 'variavel'
  }));

  const keywords = [...COMPLETION_KEYWORDS, ...BUILTINS].map((label) => ({
    label,
    type: BUILTINS.includes(label) ? 'function' : 'keyword',
    detail: BUILTINS.includes(label) ? 'funcao nativa' : 'Visualg'
  }));

  return [...keywords, ...variables];
}
