import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const examplesDir = path.resolve(__dirname, '../../examples');

export async function listExampleNames() {
  return listExamplesInDir(examplesDir);
}

export async function readExample(name) {
  const normalizedName = name.replaceAll('\\', '/');
  if (normalizedName.includes('..')) throw new Error('Nome de exemplo invalido.');
  const filePath = path.join(examplesDir, normalizedName);
  return readFile(filePath, 'utf8');
}

async function listExamplesInDir(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listExamplesInDir(entryPath, relativeName));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.alg')) {
      results.push(relativeName);
    }
  }

  return results.sort((a, b) => a.localeCompare(b));
}
