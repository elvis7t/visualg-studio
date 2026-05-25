export function createEditorController({ status, actions }) {
  return {
    updateStatus(view) {
      if (!view) {
        status.textContent = 'Linha 1, Coluna 1';
        return;
      }

      const position = getCursorPosition(view.state.doc.toString(), view.state.selection.main.head);
      status.textContent = `Linha ${position.line}, Coluna ${position.column}`;
    },
    keymap() {
      return [
        {
          key: 'Mod-s',
          run() {
            actions.save();
            return true;
          }
        },
        {
          key: 'Mod-Enter',
          run() {
            actions.run();
            return true;
          }
        },
        {
          key: 'F5',
          run() {
            actions.debug();
            return true;
          }
        },
        {
          key: 'F9',
          run() {
            actions.run();
            return true;
          }
        },
        {
          key: 'F8',
          run() {
            actions.next?.();
            return true;
          }
        },
        {
          key: 'Shift-F8',
          run() {
            actions.previous?.();
            return true;
          }
        },
        {
          key: 'Mod-f',
          run() {
            actions.find();
            return true;
          }
        },
        {
          key: 'Mod-h',
          run() {
            actions.replace();
            return true;
          }
        },
        {
          key: 'Alt-Shift-f',
          run() {
            actions.indent();
            return true;
          }
        }
      ];
    }
  };
}

export function getCursorPosition(value, selectionStart) {
  const beforeCursor = value.slice(0, selectionStart);
  const lines = beforeCursor.split('\n');
  return {
    line: lines.length,
    column: lines.at(-1).length + 1
  };
}
