import { BUILTINS, COMPLETION_KEYWORDS } from './lexicon.js';
import { normalizeKeyword } from './tokenizer.js';

export function suggestCommand(commandName) {
  const command = normalizeKeyword(commandName);
  const candidates = [...new Set([...COMPLETION_KEYWORDS, ...BUILTINS])];
  const suggestion = candidates
    .map((candidate) => ({ candidate, distance: levenshteinDistance(command, candidate) }))
    .filter((item) => item.distance <= 2)
    .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))[0];
  return suggestion ? ` Voce quis dizer "${suggestion.candidate}"?` : '';
}

export function levenshteinDistance(left, right) {
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
