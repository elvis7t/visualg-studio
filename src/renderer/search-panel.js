export function createSearchPanel({
  panel,
  findInput,
  replaceInput,
  matchCaseInput,
  status,
  closeButton,
  previousButton,
  nextButton,
  replaceButton,
  replaceAllButton,
  editor
}) {
  function refresh() {
    const query = findInput.value;
    const result = editor.find(query, { caseSensitive: matchCaseInput.checked });
    status.textContent = formatStatus(result);
  }

  return {
    init() {
      findInput.addEventListener('input', refresh);
      matchCaseInput.addEventListener('change', refresh);
      closeButton.addEventListener('click', () => this.close());
      previousButton.addEventListener('click', () => this.previous());
      nextButton.addEventListener('click', () => this.next());
      replaceButton.addEventListener('click', () => this.replaceCurrent());
      replaceAllButton.addEventListener('click', () => this.replaceAll());
      findInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.shiftKey ? this.previous() : this.next();
        }
        if (event.key === 'Escape') this.close();
      });
    },
    open({ replace = false } = {}) {
      panel.hidden = false;
      panel.dataset.mode = replace ? 'replace' : 'find';
      findInput.focus();
      findInput.select();
      refresh();
    },
    close() {
      panel.hidden = true;
      editor.focus();
    },
    next() {
      const result = editor.findNext(findInput.value, { caseSensitive: matchCaseInput.checked });
      status.textContent = formatStatus(result);
      findInput.focus();
    },
    previous() {
      const result = editor.findPrevious(findInput.value, { caseSensitive: matchCaseInput.checked });
      status.textContent = formatStatus(result);
      findInput.focus();
    },
    replaceCurrent() {
      const result = editor.replaceCurrent(findInput.value, replaceInput.value, { caseSensitive: matchCaseInput.checked });
      status.textContent = formatStatus(result);
      findInput.focus();
    },
    replaceAll() {
      const result = editor.replaceAll(findInput.value, replaceInput.value, { caseSensitive: matchCaseInput.checked });
      status.textContent = result.replaced > 0 ? `${result.replaced} substituicoes` : formatStatus(result);
      findInput.focus();
    }
  };
}

function formatStatus(result) {
  if (!result?.query) return 'Digite para buscar';
  if (result.total === 0) return 'Nenhuma ocorrencia';
  return `${result.current}/${result.total}`;
}
