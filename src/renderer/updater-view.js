export function buildReleaseNotesModel(info = {}) {
  const items = [];
  if (info.releaseName) {
    items.push({
      type: 'title',
      text: String(info.releaseName),
    });
  }

  if (Array.isArray(info.releaseNotes)) {
    for (const note of info.releaseNotes) {
      items.push({
        type: 'version-note',
        version: String(note?.version ?? ''),
        text: String(note?.note ?? ''),
      });
    }
  } else if (info.releaseNotes) {
    items.push({
      type: 'note',
      text: String(info.releaseNotes),
    });
  }

  return items;
}

export function renderReleaseNotes(container, info = {}) {
  if (!container) return;
  const items = buildReleaseNotesModel(info);
  container.replaceChildren();
  container.hidden = items.length === 0;
  if (!items.length) return;

  for (const item of items) {
    const element = container.ownerDocument.createElement('div');
    if (item.type === 'title') {
      element.className = 'updater-release-title';
      element.textContent = item.text;
    } else if (item.type === 'version-note') {
      element.className = 'updater-release-note';
      const strong = container.ownerDocument.createElement('strong');
      strong.textContent = item.version ? `v${item.version}:` : 'Notas:';
      const text = container.ownerDocument.createElement('span');
      text.textContent = item.text;
      element.append(strong, container.ownerDocument.createElement('br'), text);
    } else {
      element.className = 'updater-release-note';
      element.textContent = item.text;
    }
    container.append(element);
  }
}

export function clearReleaseNotes(container) {
  if (!container) return;
  container.replaceChildren();
  container.hidden = true;
}
