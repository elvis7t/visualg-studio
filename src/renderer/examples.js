export async function loadExamples({ examples, files }) {
  try {
    if (!window.visualg?.listExamples) {
      throw new Error('API do preload indisponivel.');
    }

    const names = await window.visualg.listExamples();
    examples.replaceChildren(...createExampleGroups(names, files));
  } catch (error) {
    examples.textContent = `Nao foi possivel carregar exemplos. ${error.message}`;
  }
}

const GROUP_ICONS = new Map([
  ['Básicos', '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /><path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" />'],
  ['Controle', '<circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M9 6h3a6 6 0 0 1 6 6v3" /><path d="M6 9v12" />'],
  ['Entrada e saída', '<path d="m4 17 6-5-6-5" /><path d="M12 19h8" />'],
  ['Funções nativas', '<path d="M12 3 9.7 8.4 4 10.7l5.7 2.2L12 18l2.3-5.1 5.7-2.2-5.7-2.3Z" /><path d="M19 18v3" /><path d="M17.5 19.5h3" />'],
  ['Subprogramas', '<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="8.5" y="14" width="7" height="7" rx="1" />'],
  ['Vetores', '<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M9 4v16" /><path d="M15 4v16" />'],
  ['Gerais', '<path d="M4 7h6l2 3h8v8.5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5V7Z" /><path d="M4 10h16" />']
]);

const GROUP_LABELS = new Map([
  ['basicos', 'Básicos'],
  ['controle', 'Controle'],
  ['entrada-e-saida', 'Entrada e saída'],
  ['funcoes-nativas', 'Funções nativas'],
  ['subprogramas', 'Subprogramas'],
  ['vetores', 'Vetores']
]);

function createExampleGroups(names, files) {
  const groups = new Map();
  for (const name of names) {
    const parts = name.split('/');
    const groupName = parts.length > 1 ? formatGroupName(parts[0]) : 'Gerais';
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(name);
  }

  return [...groups.entries()].map(([groupName, groupItems], index) => {
    const details = document.createElement('details');
    details.className = 'example-group';
    details.open = index === 0;

    const summary = document.createElement('summary');
    const icon = document.createElement('span');
    icon.className = 'example-group-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<svg viewBox="0 0 24 24">${GROUP_ICONS.get(groupName) ?? GROUP_ICONS.get('Gerais')}</svg>`;
    const label = document.createElement('span');
    label.textContent = groupName;
    summary.append(icon, label);
    details.append(summary, ...groupItems.map((name) => createExampleButton(name, files)));
    return details;
  });
}

function createExampleButton(name, files) {
  const button = document.createElement('button');
  button.className = 'example-item';
  button.textContent = name.split('/').at(-1);
  button.addEventListener('click', async () => {
    files.setExample(name, await window.visualg.readExample(name));
  });
  return button;
}

function formatGroupName(name) {
  if (GROUP_LABELS.has(name)) return GROUP_LABELS.get(name);

  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
