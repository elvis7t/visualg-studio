import { evaluateWatchExpression } from '../interpreter/index.js';

export function createDebugPanel({
  debugSteps,
  debugVariables,
  onStepChange = () => {},
  onOutputChange = () => {},
  onClear = () => {}
}) {
  let debugSession = null;
  let currentSnapshot = null;
  let watchExpression = '';

  return {
    async setSession(session) {
      debugSession = session;
      await this.render(debugSession.current());
    },
    async previous() {
      if (debugSession) await this.render(debugSession.previous());
    },
    async next() {
      if (debugSession) await this.render(debugSession.next());
    },
    async continueExecution() {
      if (debugSession) await this.render(debugSession.continueExecution());
    },
    async previousBreakpoint() {
      if (debugSession) await this.render(debugSession.previousBreakpoint());
    },
    async nextBreakpoint() {
      if (debugSession) await this.render(debugSession.nextBreakpoint());
    },
    stop() {
      if (!debugSession) return;
      this.render(debugSession.stop());
      debugSession = null;
      currentSnapshot = null;
      onClear();
    },
    clear() {
      if (debugSession) debugSession.stop();
      debugSession = null;
      currentSnapshot = null;
      watchExpression = '';
      debugSteps.replaceChildren();
      debugVariables.textContent = 'Sem sessão de depuração.';
      onClear();
    },
    async render(snapshotOrPromise) {
      const snapshot = await snapshotOrPromise;
      if (!snapshot.active) {
        debugVariables.textContent = 'Depuração encerrada.';
        onClear();
        return;
      }

      currentSnapshot = snapshot;
      debugSteps.replaceChildren(...createStepItems(snapshot));
      debugSteps.querySelector('.active-step')?.scrollIntoView({ block: 'center', inline: 'nearest' });
      renderVariables(debugVariables, snapshot, watchExpression);
      bindWatch(debugVariables, {
        getSnapshot: () => currentSnapshot,
        getExpression: () => watchExpression,
        setExpression: (expression) => {
          watchExpression = expression;
        }
      });
      bindBreakpointNavigation(debugVariables, this);
      onStepChange(snapshot.step?.line ?? null);
      onOutputChange(snapshot.step?.output ?? []);
    }
  };
}

function createStepItems(snapshot) {
  return Array.from({ length: snapshot.total }, (_, index) => {
    const item = document.createElement('li');
    item.className = index === snapshot.index ? 'active-step' : '';
    item.textContent = index === snapshot.index
      ? `Passo ${index + 1}: ${formatDebugPhase(snapshot.step.phase)} ${snapshot.step.detail}`
      : `Passo ${index + 1}`;
    return item;
  });
}

function renderVariables(container, snapshot, watchExpression) {
  if (!snapshot.step) {
    container.textContent = 'Sem passos de depuração.';
    return;
  }

  const rows = Object.entries(snapshot.step.variables).map(([name, value]) => `
    <tr>
      <th scope="row">${escapeHtml(name)}</th>
      <td>${escapeHtml(snapshot.step.variableTypes?.[name] ?? '-')}</td>
      <td>${escapeHtml(formatDebugValue(value))}</td>
    </tr>
  `).join('');

  const breakpointNavigation = snapshot.hasMultipleBreakpoints ? `
    <section class="debug-breakpoint-nav">
      <button id="previousBreakpointButton" type="button">Ponto de parada anterior</button>
      <button id="nextBreakpointButton" type="button">Próximo ponto de parada</button>
    </section>
  ` : '';

  container.innerHTML = `
    <section class="debug-summary">
      <div><span>Passo</span><strong>${snapshot.index + 1}/${snapshot.total}</strong></div>
      <div><span>Fase</span><strong>${escapeHtml(formatDebugPhase(snapshot.step.phase))}</strong></div>
      <div><span>Comando</span><strong>${escapeHtml(snapshot.step.detail)}</strong></div>
    </section>
    ${breakpointNavigation}
    <section class="debug-watch">
      <label>
        <span>Inspeção</span>
        <input id="debugWatchInput" value="${escapeAttribute(watchExpression)}" placeholder="baixo + alto" autocomplete="off" />
      </label>
      <pre id="debugWatchResult"></pre>
    </section>
    <table class="debug-var-table">
      <thead><tr><th>Variavel</th><th>Tipo</th><th>Valor</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3">Sem variaveis.</td></tr>'}</tbody>
    </table>
    <section class="debug-output">
      <span>Saida ate agora</span>
      <pre>${escapeHtml(snapshot.step.output.join('\n') || '(sem saída)')}</pre>
    </section>
  `;

  renderWatchResult(container.querySelector('#debugWatchResult'), snapshot, watchExpression);
}

export function formatDebugPhase(phase) {
  if (phase === 'before') return 'antes';
  if (phase === 'after') return 'depois';
  return phase;
}

function formatDebugValue(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter((item) => item !== undefined));
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}

function bindWatch(container, state) {
  const input = container.querySelector('#debugWatchInput');
  const result = container.querySelector('#debugWatchResult');
  input?.addEventListener('input', () => {
    state.setExpression(input.value);
    renderWatchResult(result, state.getSnapshot(), state.getExpression());
  });
}

function bindBreakpointNavigation(container, debugPanel) {
  container.querySelector('#previousBreakpointButton')?.addEventListener('click', () => debugPanel.previousBreakpoint());
  container.querySelector('#nextBreakpointButton')?.addEventListener('click', () => debugPanel.nextBreakpoint());
}

async function renderWatchResult(container, snapshot, expression) {
  if (!container) return;
  const cleanExpression = expression.trim();
  if (!cleanExpression) {
    container.textContent = '(digite uma expressao)';
    container.classList.remove('error');
    return;
  }

  try {
    container.textContent = formatDebugValue(await evaluateWatchExpression(snapshot, cleanExpression));
    container.classList.remove('error');
  } catch (error) {
    container.textContent = error.message;
    container.classList.add('error');
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
