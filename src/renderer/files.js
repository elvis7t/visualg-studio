export function createFileController({ editor, fileLabel, tabsContainer, recentFilesList, consoleView, defaultSource, createDefaultSource }) {
  const STORAGE_KEY = 'visualg-editor-tabs-session';
  const RECENTS_KEY = 'visualg-recent-files';
  const getDefaultSource = createDefaultSource ?? (() => defaultSource);
  const tabs = [];
  let nextId = 1;
  let activeId = null;
  let persistTimer = null;

  restoreSession();
  renderRecentFiles();

  return {
    getActiveTab() {
      return getActiveTab();
    },
    newFile() {
      const content = getDefaultSource();
      createTab({
        title: 'MeuAlgoritmo',
        content,
        savedContent: content,
        filePath: null,
        state: 'empty'
      });
      consoleView.write('Novo algoritmo criado.');
    },
    async openFile() {
      const file = await window.visualg.openFile();
      if (!file) return;
      createTab({
        title: fileNameFromPath(file.filePath),
        content: file.content,
        savedContent: file.content,
        filePath: file.filePath,
        state: 'path'
      });
      addRecentFile(file.filePath);
      consoleView.write(`Arquivo aberto: ${file.filePath}`);
    },
    async saveFile() {
      const active = getActiveTab();
      if (!active) return;
      syncActiveContent();
      const saved = await window.visualg.saveFile({
        filePath: active.filePath,
        content: active.content
      });
      if (!saved) return;
      active.filePath = saved.filePath;
      active.title = fileNameFromPath(saved.filePath);
      active.state = 'path';
      active.label = null;
      active.savedContent = active.content;
      addRecentFile(saved.filePath);
      applyActiveMetadata();
      renderTabs();
      persistSession();
      consoleView.write(`Arquivo salvo: ${saved.filePath}`);
    },
    setExample(name, content) {
      createTab({
        title: name.split('/').at(-1),
        content,
        savedContent: content,
        filePath: null,
        state: 'example',
        label: `Exemplo: ${name}`
      });
      consoleView.write(`Exemplo carregado: ${name}`);
    },
    syncActiveContent,
    closeActiveTab() {
      closeTab(activeId);
    },
    activateNextTab() {
      activateRelativeTab(1);
    },
    activatePreviousTab() {
      activateRelativeTab(-1);
    },
    getActiveFileName() {
      syncActiveContent();
      const active = getActiveTab();
      return active?.title ?? 'algoritmo.alg';
    }
  };

  function createTab(tab) {
    syncActiveContent();

    if (tab.filePath) {
      const normPath = normalizePath(tab.filePath);
      const existing = tabs.find((t) => t.filePath && normalizePath(t.filePath) === normPath);
      if (existing) {
        activateTab(existing.id);
        return;
      }
    }

    const id = nextId;
    nextId += 1;
    tabs.push({ id, ...tab });
    activateTab(id);
    persistSession();
  }

  function activateTab(id) {
    syncActiveContent();
    activeId = id;
    const active = getActiveTab();
    if (!active) return;
    editor.value = active.content;
    applyActiveMetadata();
    renderTabs();
    persistSession();
    editor.focus();
  }

  function closeTab(id) {
    syncActiveContent();
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;

    const tab = tabs[index];
    if (isDirty(tab) && !window.confirm(`Fechar "${tab.title}" sem salvar?`)) return;

    tabs.splice(index, 1);
    if (tabs.length === 0) {
      const content = getDefaultSource();
      createTab({
        title: 'MeuAlgoritmo',
        content,
        savedContent: content,
        filePath: null,
        state: 'empty'
      });
      return;
    }

    if (activeId === id) {
      activeId = tabs[Math.max(0, index - 1)].id;
      editor.value = getActiveTab().content;
    }

    applyActiveMetadata();
    renderTabs();
    persistSession();
  }

  function syncActiveContent() {
    const active = getActiveTab();
    if (!active) return;
    const nextContent = editor.value;
    const changed = active.content !== nextContent;
    active.content = nextContent;
    if (changed) {
      renderTabs();
      schedulePersistSession();
    }
  }

  function activateRelativeTab(direction) {
    if (tabs.length < 2) return;
    const index = tabs.findIndex((tab) => tab.id === activeId);
    const nextIndex = (index + direction + tabs.length) % tabs.length;
    activateTab(tabs[nextIndex].id);
  }

  function getActiveTab() {
    return tabs.find((tab) => tab.id === activeId) ?? null;
  }

  function applyActiveMetadata() {
    const active = getActiveTab();
    if (!active) return;
    fileLabel.dataset.fileState = active.state;
    fileLabel.textContent = active.label ?? active.filePath ?? 'Sem arquivo';
  }

  function renderTabs() {
    tabsContainer.replaceChildren(...tabs.map((tab) => {
      const dirty = isDirty(tab);
      const button = document.createElement('button');
      button.className = `file-tab${tab.id === activeId ? ' active' : ''}${dirty ? ' dirty' : ''}`;
      button.type = 'button';
      button.title = tab.filePath ?? tab.title;
      button.addEventListener('click', () => activateTab(tab.id));

      const title = document.createElement('span');
      title.className = 'file-tab-title';
      title.textContent = tab.title;

      const dirtyMarker = document.createElement('span');
      dirtyMarker.className = 'file-tab-dirty';
      dirtyMarker.textContent = '•';
      dirtyMarker.title = 'Alterações não salvas';

      const close = document.createElement('span');
      close.className = 'file-tab-close';
      close.textContent = '×';
      close.title = 'Fechar aba';
      close.addEventListener('click', (event) => {
        event.stopPropagation();
        closeTab(tab.id);
      });

      button.append(title, dirtyMarker, close);
      return button;
    }));
  }

  async function openRecentFile(filePath) {
    try {
      const file = await window.visualg.openFilePath(filePath);
      createTab({
        title: fileNameFromPath(file.filePath),
        content: file.content,
        savedContent: file.content,
        filePath: file.filePath,
        state: 'path'
      });
      addRecentFile(file.filePath);
      consoleView.write(`Arquivo aberto: ${file.filePath}`);
    } catch (error) {
      removeRecentFile(filePath);
      consoleView.write(`Não foi possível abrir recente: ${error.message}`, true);
    }
  }

  function addRecentFile(filePath) {
    const normPath = normalizePath(filePath);
    const recent = [filePath, ...readRecentFiles().filter((item) => normalizePath(item) !== normPath)].slice(0, 8);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recent));
    renderRecentFiles();
  }

  function removeRecentFile(filePath) {
    const normPath = normalizePath(filePath);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(readRecentFiles().filter((item) => normalizePath(item) !== normPath)));
    renderRecentFiles();
  }

  function readRecentFiles() {
    try {
      const value = JSON.parse(localStorage.getItem(RECENTS_KEY));
      return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  function renderRecentFiles() {
    const recent = readRecentFiles();
    if (!recent.length) {
      recentFilesList.textContent = 'Nenhum arquivo recente.';
      return;
    }

    recentFilesList.replaceChildren(...recent.map((filePath) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recent-file-button';
      button.title = filePath;
      button.textContent = fileNameFromPath(filePath);
      button.addEventListener('click', () => openRecentFile(filePath));
      return button;
    }));
  }

  function restoreSession() {
    const restored = readSession();
    if (restored?.tabs?.length) {
      for (const tab of restored.tabs) {
        const id = nextId;
        nextId += 1;
        tabs.push({
          id,
          title: tab.title || 'MeuAlgoritmo',
          content: typeof tab.content === 'string' ? tab.content : getDefaultSource(),
          savedContent: typeof tab.savedContent === 'string' ? tab.savedContent : (typeof tab.content === 'string' ? tab.content : getDefaultSource()),
          filePath: tab.filePath || null,
          state: tab.state || 'empty',
          label: tab.label || null
        });
        if (tab.id === restored.activeId) activeId = id;
      }
      activeId ??= tabs[0].id;
      const active = getActiveTab();
      editor.value = active.content;
      applyActiveMetadata();
      renderTabs();
      return;
    }

    const initialContent = editor.value || getDefaultSource();
    const id = nextId;
    nextId += 1;
    tabs.push({
      id,
      title: 'MeuAlgoritmo',
      content: initialContent,
      savedContent: initialContent,
      filePath: null,
      state: 'empty'
    });
    activeId = id;
    applyActiveMetadata();
    renderTabs();
    persistSession();
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  function schedulePersistSession() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistSession, 180);
  }

  function persistSession() {
    clearTimeout(persistTimer);
    persistTimer = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activeId,
      tabs: tabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        content: tab.content,
        savedContent: tab.savedContent,
        filePath: tab.filePath,
        state: tab.state,
        label: tab.label ?? null
      }))
    }));
  }
}

function isDirty(tab) {
  return tab.content !== tab.savedContent;
}

function fileNameFromPath(filePath) {
  return filePath.split(/[\\/]/).at(-1) || filePath;
}

function normalizePath(filePath) {
  if (typeof filePath !== 'string') return '';
  const clean = filePath.replace(/\\/g, '/');
  const isWindows = typeof navigator !== 'undefined' && /Win/.test(navigator.platform);
  return isWindows ? clean.toLowerCase() : clean;
}
