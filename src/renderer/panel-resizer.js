const defaultDebugHeight = 180;
const defaultEditorHeight = 360;
const minEditorHeight = 180;
const minConsoleHeight = 130;
const minDebugHeight = 120;
const minDebugStepsWidth = 260;
const minDebugVarsWidth = 240;
const resizerHeight = 16;
const sideResizerWidth = 8;

export function createEditorResizer({ workspace, resizer, storageKey }) {
  return {
    init() {
      const savedHeight = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(savedHeight) && savedHeight > 0) {
        setEditorHeight(workspace, savedHeight);
      }

      resizer.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        resizer.setPointerCapture(event.pointerId);
        document.body.classList.add('resizing-panels');

        const startY = event.clientY;
        const startHeight = workspace.querySelector('.editor-panel').getBoundingClientRect().height;

        const onMove = (moveEvent) => {
          const bounds = workspace.getBoundingClientRect();
          const maxEditorHeight = Math.max(minEditorHeight, bounds.height - minConsoleHeight - minDebugHeight - resizerHeight);
          const nextHeight = clamp(startHeight + moveEvent.clientY - startY, minEditorHeight, maxEditorHeight, defaultEditorHeight);
          setEditorHeight(workspace, nextHeight);
          localStorage.setItem(storageKey, String(Math.round(nextHeight)));
        };

        const onUp = () => {
          document.body.classList.remove('resizing-panels');
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    }
  };
}

export function createPanelResizer({ workspace, resizer, storageKey }) {
  return {
    init() {
      const savedHeight = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(savedHeight) && savedHeight > 0) {
        setDebugHeight(workspace, savedHeight);
      }

      resizer.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        resizer.setPointerCapture(event.pointerId);
        document.body.classList.add('resizing-panels');

        const startY = event.clientY;
        const startHeight = workspace.querySelector('.debug-panel').getBoundingClientRect().height;

        const onMove = (moveEvent) => {
          const bounds = workspace.getBoundingClientRect();
          const delta = moveEvent.clientY - startY;
          const isDebugFirst = workspace.dataset.panelLayout === 'debug-first';
          const debugHeight = isDebugFirst ? startHeight + delta : startHeight - delta;
          const editorHeight = workspace.querySelector('.editor-panel').getBoundingClientRect().height;
          const maxDebugHeight = Math.max(minDebugHeight, bounds.height - editorHeight - minConsoleHeight - resizerHeight);
          const nextHeight = clamp(debugHeight, minDebugHeight, maxDebugHeight, defaultDebugHeight);
          setDebugHeight(workspace, nextHeight);
          localStorage.setItem(storageKey, String(Math.round(nextHeight)));
        };

        const onUp = () => {
          document.body.classList.remove('resizing-panels');
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    }
  };
}

export function createDebugSideResizer({ debugGrid, resizer, storageKey }) {
  return {
    init() {
      const savedWidth = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(savedWidth) && savedWidth > 0) {
        setDebugVarsWidth(debugGrid, savedWidth);
      }

      resizer.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        resizer.setPointerCapture(event.pointerId);
        document.body.classList.add('resizing-debug-side');

        const startX = event.clientX;
        const startWidth = debugGrid.querySelector('.debug-vars').getBoundingClientRect().width;

        const onMove = (moveEvent) => {
          const bounds = debugGrid.getBoundingClientRect();
          const maxWidth = Math.max(minDebugVarsWidth, bounds.width - minDebugStepsWidth - sideResizerWidth);
          const nextWidth = clamp(startWidth - (moveEvent.clientX - startX), minDebugVarsWidth, maxWidth, startWidth);
          setDebugVarsWidth(debugGrid, nextWidth);
          localStorage.setItem(storageKey, String(Math.round(nextWidth)));
        };

        const onUp = () => {
          document.body.classList.remove('resizing-debug-side');
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    }
  };
}

function setEditorHeight(workspace, editorHeight) {
  workspace.style.setProperty('--editor-panel-height', `${editorHeight}px`);
}

function setDebugHeight(workspace, debugHeight) {
  workspace.style.setProperty('--debug-panel-height', `${debugHeight}px`);
}

function setDebugVarsWidth(debugGrid, width) {
  debugGrid.style.setProperty('--debug-vars-width', `${width}px`);
}

function clamp(value, min, max, fallback) {
  return Math.min(Math.max(value || fallback, min), max);
}
