import {
  analyzeVisualgMetrics,
  createInteractiveDebugSession,
  runVisualg,
} from "../interpreter/index.js";
import { createFlowchart } from "../interpreter/flowchart.js";
import { formatVisualg } from "../interpreter/formatter.js";
import { createConsoleView } from "./console-view.js";
import { createDebugPanel } from "./debug-panel.js";
import { DOCS_TABS } from "./docs-dialog.js";
import {
  createFlowchartDialog,
  flowchartExportName,
  svgToPngDataUrl,
} from "./flowchart-dialog.js";
import { createEditorController } from "./editor-controller.js";
import { createCodeMirrorEditor } from "./codemirror-editor.js";
import { loadExamples } from "./examples.js";
import { createFileController } from "./files.js";
import { createInputDialog } from "./input-dialog.js";
import { createSearchPanel } from "./search-panel.js";
import {
  createDebugSideResizer,
  createEditorResizer,
  createPanelResizer,
} from "./panel-resizer.js";
import { createThemeController } from "./theme.js";
import { clearReleaseNotes, renderReleaseNotes } from "./updater-view.js";
import { createInterpreterWorkerClient } from "./worker-client.js";

function getTodayPtBr() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function createDefaultSource() {
  return `Algoritmo "MeuAlgoritmo"

// Disciplina: Algoritmos
// Professor: Antonio Carlos Nicolodi 
// Descrição: Descreva o que o algoritmo faz
// Autor(a): Nome do(a) aluno(a)
// Data: ${getTodayPtBr()}

Var
// Seção de Declarações das variáveis


Inicio
// Seção de Comandos, procedimento, funções, operadores, etc... 


fimalgoritmo`;
}

const editorHost = document.querySelector("#editor");
const elements = {
  output: document.querySelector("#consoleOutput"),
  stdin: document.querySelector("#stdin"),
  fileLabel: document.querySelector("#fileLabel"),
  editorTabs: document.querySelector("#editorTabs"),
  recentFilesList: document.querySelector("#recentFilesList"),
  examples: document.querySelector("#examples"),
  debugSteps: document.querySelector("#debugSteps"),
  debugVariables: document.querySelector("#debugVariables"),
  themeSelect: document.querySelector("#themeSelect"),
  layoutSelect: document.querySelector("#layoutSelect"),
  tabSizeSelect: document.querySelector("#tabSizeSelect"),
  infiniteLoopDetectionSelect: document.querySelector(
    "#infiniteLoopDetectionSelect",
  ),
  debugPanelVisibilitySelect: document.querySelector(
    "#debugPanelVisibilitySelect",
  ),
  generalFontSizeInput: document.querySelector("#generalFontSizeInput"),
  generalFontSizeValue: document.querySelector("#generalFontSizeValue"),
  editorFontSizeInput: document.querySelector("#editorFontSizeInput"),
  editorFontSizeValue: document.querySelector("#editorFontSizeValue"),
  consoleFontSizeInput: document.querySelector("#consoleFontSizeInput"),
  consoleFontSizeValue: document.querySelector("#consoleFontSizeValue"),
  editorFontSelect: document.querySelector("#editorFontSelect"),
  lineWrapSelect: document.querySelector("#lineWrapSelect"),
  indentGuidesSelect: document.querySelector("#indentGuidesSelect"),
  complexityMetricsSelect: document.querySelector("#complexityMetricsSelect"),
  inputDialog: document.querySelector("#inputDialog"),
  inputFields: document.querySelector("#inputFields"),
  inputForm: document.querySelector("#inputForm"),
  searchPanel: document.querySelector("#searchPanel"),
  findInput: document.querySelector("#findInput"),
  replaceInput: document.querySelector("#replaceInput"),
  matchCaseInput: document.querySelector("#matchCaseInput"),
  searchStatus: document.querySelector("#searchStatus"),
  closeSearchButton: document.querySelector("#closeSearchButton"),
  findPreviousButton: document.querySelector("#findPreviousButton"),
  findNextButton: document.querySelector("#findNextButton"),
  replaceButton: document.querySelector("#replaceButton"),
  replaceAllButton: document.querySelector("#replaceAllButton"),
  editorStatus: document.querySelector("#editorStatus"),
  editorMetrics: document.querySelector("#editorMetrics"),
  sidebarSearch: document.querySelector("#sidebarSearch"),
  workspace: document.querySelector(".workspace"),
  editorResizer: document.querySelector("#editorResizer"),
  panelResizer: document.querySelector("#consoleDebugResizer"),
  debugGrid: document.querySelector(".debug-grid"),
  debugSideResizer: document.querySelector("#debugSideResizer"),
  exportCodeButton: document.querySelector("#exportCodeButton"),
  printCodeButton: document.querySelector("#printCodeButton"),
  flowchartButton: document.querySelector("#flowchartButton"),
  flowchartDialog: document.querySelector("#flowchartDialog"),
  flowchartContent: document.querySelector("#flowchartContent"),
  flowchartTitle: document.querySelector("#flowchartTitle"),
  flowchartCloseButton: document.querySelector("#flowchartCloseButton"),
  flowchartExportSvgButton: document.querySelector("#flowchartExportSvgButton"),
  flowchartExportPngButton: document.querySelector("#flowchartExportPngButton"),
  aboutDialog: document.querySelector("#aboutDialog"),
  aboutButton: document.querySelector("#activityBtnAbout"),
  aboutCloseButton: document.querySelector("#aboutCloseButton"),
};

let searchPanel;
let files;
let theme;
const editorController = createEditorController({
  status: elements.editorStatus,
  actions: {
    save: () => files.saveFile(),
    run: () => runCurrentSource(),
    debug: () => debugCurrentSource(),
    next: () => debugPanel.next(),
    continueExecution: () => debugPanel.continueExecution(),
    previous: () => debugPanel.previous(),
    indent: () => indentCurrentSource(),
    find: () => searchPanel.open(),
    replace: () => searchPanel.open({ replace: true }),
  },
});
const editor = createCodeMirrorEditor({
  host: editorHost,
  initialValue: createDefaultSource(),
  extraKeymap: editorController.keymap(),
  onUpdate: (view) => {
    editorController.updateStatus(view);
    files?.syncActiveContent();
    updateEditorMetrics();
  },
});
const debugPanel = createDebugPanel({
  ...elements,
  onStepChange: (line) => editor.highlightLine(line),
  onOutputChange: (output) =>
    consoleView.write(output.join("\n") || "(sem saída)"),
  onClear: () => editor.clearDebugHighlight(),
});
const consoleView = createConsoleView({
  output: elements.output,
  debug: debugPanel,
});
files = createFileController({
  editor,
  fileLabel: elements.fileLabel,
  tabsContainer: elements.editorTabs,
  recentFilesList: elements.recentFilesList,
  consoleView,
  createDefaultSource,
});
const inputDialog = createInputDialog(elements);
theme = createThemeController({
  ...elements,
  editor,
  onComplexityMetricsChange: updateEditorMetrics,
});
const interpreterClient = createInterpreterWorkerClient({
  worker: createInterpreterWorker(),
  fallbackRun: runVisualg,
  fallbackDebug: createInteractiveDebugSession,
});
searchPanel = createSearchPanel({
  panel: elements.searchPanel,
  findInput: elements.findInput,
  replaceInput: elements.replaceInput,
  matchCaseInput: elements.matchCaseInput,
  status: elements.searchStatus,
  closeButton: elements.closeSearchButton,
  previousButton: elements.findPreviousButton,
  nextButton: elements.findNextButton,
  replaceButton: elements.replaceButton,
  replaceAllButton: elements.replaceAllButton,
  editor,
});

const flowchartDialog = createFlowchartDialog({
  dialog: elements.flowchartDialog,
  content: elements.flowchartContent,
  title: elements.flowchartTitle,
  closeButton: elements.flowchartCloseButton,
  exportSvgButton: elements.flowchartExportSvgButton,
  exportPngButton: elements.flowchartExportPngButton,
  onExportSvg: exportFlowchartSvg,
  onExportPng: exportFlowchartPng,
});
elements.fileLabel.dataset.fileState = "empty";

document
  .querySelector("#newButton")
  .addEventListener("click", () => files.newFile());
document
  .querySelector("#openButton")
  .addEventListener("click", () => files.openFile());
document
  .querySelector("#saveButton")
  .addEventListener("click", () => files.saveFile());
document
  .querySelector("#indentButton")
  .addEventListener("click", indentCurrentSource);
document
  .querySelector("#runButton")
  .addEventListener("click", runCurrentSource);
document
  .querySelector("#debugButton")
  .addEventListener("click", debugCurrentSource);
document
  .querySelector("#debugPreviousButton")
  .addEventListener("click", () => debugPanel.previous());
document
  .querySelector("#debugNextButton")
  .addEventListener("click", () => debugPanel.next());
document
  .querySelector("#debugContinueButton")
  .addEventListener("click", () => debugPanel.continueExecution());
document
  .querySelector("#debugStopButton")
  .addEventListener("click", () => debugPanel.stop());
document.querySelector("#clearAllButton").addEventListener("click", clearAll);
document
  .querySelector("#clearConsoleButton")
  .addEventListener("click", () => consoleView.clear());
document
  .querySelector("#exportConsoleButton")
  .addEventListener("click", exportConsoleOutput);
document
  .querySelector("#clearDebugButton")
  .addEventListener("click", () => debugPanel.clear());
elements.exportCodeButton.addEventListener("click", exportCurrentSource);
elements.printCodeButton.addEventListener("click", printCurrentSource);
elements.flowchartButton.addEventListener("click", showFlowchart);

document.addEventListener("keydown", handleGlobalShortcuts);

theme.init();
searchPanel.init();
flowchartDialog.init();
initAutoUpdater();
initSidebarDocs();
initSidebarTips();

if (elements.aboutButton && elements.aboutDialog) {
  elements.aboutButton.addEventListener("click", () => {
    elements.aboutDialog.showModal();
  });
}
if (elements.aboutCloseButton) {
  elements.aboutCloseButton.addEventListener("click", () => {
    if (elements.aboutDialog) elements.aboutDialog.close();
  });
}

const sidebarExportConsoleBtn = document.querySelector("#sidebarExportConsoleButton");
if (sidebarExportConsoleBtn) {
  sidebarExportConsoleBtn.addEventListener("click", exportConsoleOutput);
}
createPanelResizer({
  workspace: elements.workspace,
  resizer: elements.panelResizer,
  storageKey: "visualg-console-debug-split",
}).init();
createEditorResizer({
  workspace: elements.workspace,
  resizer: elements.editorResizer,
  storageKey: "visualg-editor-split",
}).init();
createDebugSideResizer({
  debugGrid: elements.debugGrid,
  resizer: elements.debugSideResizer,
  storageKey: "visualg-debug-side-split",
}).init();
loadExamples({ examples: elements.examples, files });
editorController.updateStatus(editor.view);
updateEditorMetrics();
// ==========================================
// Sidebar and Activity Bar Layout Controller
// ==========================================
const sidebarViews = {
  "#activityBtnExplorer": {
    btn: document.querySelector("#activityBtnExplorer"),
    view: document.querySelector("#sidebarExplorerView")
  },
  "#activityBtnDocs": {
    btn: document.querySelector("#activityBtnDocs"),
    view: document.querySelector("#sidebarDocsView")
  },
  "#activityBtnTools": {
    btn: document.querySelector("#activityBtnTools"),
    view: document.querySelector("#sidebarToolsView")
  },
  "#activityBtnTips": {
    btn: document.querySelector("#activityBtnTips"),
    view: document.querySelector("#sidebarTipsView")
  },
  "#activityBtnSettings": {
    btn: document.querySelector("#activityBtnSettings"),
    view: document.querySelector("#sidebarSettingsView")
  }
};

let currentActiveViewId = "#activityBtnExplorer";
let isSidebarOpen = true;

function switchView(viewId) {
  const next = sidebarViews[viewId];
  if (!next) {
    return;
  }

  const current = sidebarViews[currentActiveViewId];
  if (current) {
    current.view.hidden = true;
    current.btn.classList.remove("active-view");
  }

  next.view.hidden = false;
  next.btn.classList.add("active-view");

  currentActiveViewId = viewId;

  if (!isSidebarOpen) {
    openSidebar();
  }
}

function openSidebar() {
  isSidebarOpen = true;
  const shell = document.querySelector(".app-shell");
  shell.style.setProperty("--sidebar-width", "300px");
  document.querySelector("#sidebarContainer").classList.remove("sidebar-collapsed");
  document.querySelector("#activityBtnToggleSidebar").classList.add("active");
}

function closeSidebar() {
  isSidebarOpen = false;
  const shell = document.querySelector(".app-shell");
  shell.style.setProperty("--sidebar-width", "0px");
  document.querySelector("#sidebarContainer").classList.add("sidebar-collapsed");
  document.querySelector("#activityBtnToggleSidebar").classList.remove("active");
}

function toggleSidebar() {
  if (isSidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// Bind click listeners
Object.keys(sidebarViews).forEach((viewId) => {
  const item = sidebarViews[viewId];
  if (item.btn) {
    item.btn.addEventListener("click", () => {
      if (viewId === currentActiveViewId) {
        toggleSidebar();
      } else {
        switchView(viewId);
      }
    });
  }
});

const toggleBtn = document.querySelector("#activityBtnToggleSidebar");
if (toggleBtn) {
  toggleBtn.addEventListener("click", toggleSidebar);
}

// Bind search filter listener
if (elements.sidebarSearch) {
  elements.sidebarSearch.addEventListener("input", () => {
    const query = elements.sidebarSearch.value.toLowerCase().trim();

    // 1. Filter Recent Files
    if (elements.recentFilesList) {
      const recentItems = elements.recentFilesList.querySelectorAll(".recent-file-button");
      let hasRecentMatches = false;
      recentItems.forEach((btn) => {
        const text = btn.textContent.toLowerCase();
        if (text.includes(query)) {
          btn.style.display = "";
          hasRecentMatches = true;
        } else {
          btn.style.display = "none";
        }
      });

      let noRecentMsg = elements.recentFilesList.querySelector(".no-recent-matches-msg");
      if (query && !hasRecentMatches) {
        if (!noRecentMsg) {
          noRecentMsg = document.createElement("div");
          noRecentMsg.className = "no-recent-matches-msg";
          noRecentMsg.style.padding = "4px 8px";
          noRecentMsg.style.color = "var(--muted)";
          noRecentMsg.style.fontSize = "12px";
          noRecentMsg.textContent = "Nenhum arquivo correspondente.";
          elements.recentFilesList.appendChild(noRecentMsg);
        }
      } else if (noRecentMsg) {
        noRecentMsg.remove();
      }
    }

    // 2. Filter Examples
    if (elements.examples) {
      const groups = elements.examples.querySelectorAll(".example-group");
      const directItems = elements.examples.querySelectorAll(":scope > .example-item");

      directItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? "" : "none";
      });

      groups.forEach((group) => {
        const items = group.querySelectorAll(".example-item");
        let matchCount = 0;
        items.forEach((item) => {
          const text = item.textContent.toLowerCase();
          if (text.includes(query)) {
            item.style.display = "";
            matchCount++;
          } else {
            item.style.display = "none";
          }
        });

        if (query) {
          if (matchCount > 0) {
            group.style.display = "";
            group.open = true;
          } else {
            group.style.display = "none";
          }
        } else {
          group.style.display = "";
          group.open = false;
        }
      });
    }
  });
}

function initSidebarDocs() {
  const docsContainer = document.querySelector("#sidebarDocsView .sidebar-content");
  if (!docsContainer) return;
  const docsTabsFiltered = DOCS_TABS.filter(tab => tab.title !== 'Dicas');
  docsContainer.replaceChildren(
    ...docsTabsFiltered.map((tab, idx) => {
      const details = document.createElement("details");
      details.className = "sidebar-section";
      if (idx === 0) details.open = true;
      const summary = document.createElement("summary");
      summary.innerHTML = `<strong>${tab.title}</strong>`;
      details.appendChild(summary);

      const contentDiv = document.createElement("div");
      contentDiv.className = "sidebar-docs-sections";
      tab.sections.forEach(sec => {
        const secDiv = document.createElement("div");
        secDiv.className = "sidebar-docs-section";
        const secTitle = document.createElement("h4");
        secTitle.className = "sidebar-docs-sec-title";
        secTitle.textContent = sec.title;
        const secText = document.createElement("p");
        secText.className = "sidebar-docs-sec-text";
        secText.textContent = sec.text;
        secDiv.append(secTitle, secText);
        contentDiv.appendChild(secDiv);
      });
      details.appendChild(contentDiv);
      return details;
    })
  );
}

function initSidebarTips() {
  const tipsContainer = document.querySelector("#sidebarTipsView .sidebar-content");
  if (!tipsContainer) return;
  const tipsTab = DOCS_TABS.find(tab => tab.title === 'Dicas');
  if (!tipsTab) return;

  tipsContainer.replaceChildren(
    ...tipsTab.sections.map(sec => {
      const secDiv = document.createElement("div");
      secDiv.className = "sidebar-docs-section";
      secDiv.style.marginBottom = "14px";

      const secTitle = document.createElement("h4");
      secTitle.className = "sidebar-docs-sec-title";
      secTitle.textContent = sec.title;

      const secText = document.createElement("p");
      secText.className = "sidebar-docs-sec-text";
      secText.textContent = sec.text;

      secDiv.append(secTitle, secText);
      return secDiv;
    })
  );
}
function updateEditorMetrics() {
  if (!theme?.isComplexityMetricsEnabled?.()) {
    renderEditorMetrics(null);
    return;
  }

  try {
    renderEditorMetrics(analyzeVisualgMetrics(editor.value));
  } catch {
    renderEditorMetrics(null);
  }
}

function renderEditorMetrics(metrics) {
  if (!elements.editorMetrics) return;
  elements.editorMetrics.replaceChildren();
  if (!metrics) {
    elements.editorMetrics.hidden = true;
    return;
  }

  elements.editorMetrics.hidden = false;
  elements.editorMetrics.append(
    createMetricBadge("Ciclomática", metrics.cyclomaticComplexity),
    createMetricBadge(
      "Complexidade",
      metrics.bigO.value,
      metrics.bigO.source === "annotation",
    ),
  );
}

function createMetricBadge(label, value, annotated = false) {
  const badge = document.createElement("span");
  badge.className = annotated ? "metric-badge annotated" : "metric-badge";
  badge.title = annotated
    ? "Complexidade informada por comentario @complexidade"
    : label;

  const labelElement = document.createElement("span");
  labelElement.className = "metric-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.textContent = String(value);

  badge.append(labelElement, valueElement);
  return badge;
}

async function runCurrentSource() {
  debugPanel.clear();
  consoleView.write("Executando...");
  try {
    const result = await runCurrentAlgorithm(editor.value);
    consoleView.write(result.output.join("\n") || "(sem saída)");
  } catch (error) {
    consoleView.write(error.message, true);
  }
}

function resolveFilePath(filePath) {
  if (filePath && !/^[a-zA-Z]:[\\/]/.test(filePath) && !filePath.startsWith('/') && !filePath.startsWith('\\')) {
    const activePath = files?.getActiveTab()?.filePath;
    if (activePath) {
      const parts = activePath.split(/[\\/]/);
      parts.pop();
      parts.push(filePath);
      return parts.join('/');
    }
  }
  return filePath;
}

async function runCurrentAlgorithm(source) {
  return interpreterClient.run(source, {
    onRead: inputDialog.createReader(),
    onReadFile: async (filePath) => {
      const targetPath = resolveFilePath(filePath);
      const result = await globalThis.visualg.openFilePath(targetPath);
      return result ? result.content : '';
    },
    ...theme.getRuntimeOptions(),
  });
}

function createInterpreterWorker() {
  if (typeof Worker !== "function") return null;

  try {
    return new Worker(new URL("./interpreter-worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }
}

function clearAll() {
  consoleView.clear();
  debugPanel.clear();
  inputDialog.clear();
}

async function exportConsoleOutput() {
  const content = consoleView.getText();
  if (!content.trim()) {
    consoleView.write("Console vazio, nada para exportar.", true);
    return;
  }

  const saved = await globalThis.visualg.exportConsole({ content });
  if (saved) consoleView.write(`Console exportado: ${saved.filePath}`);
}

async function exportCurrentSource() {
  const content = editor.value;
  if (!content.trim()) {
    consoleView.write("Código vazio, nada para exportar.", true);
    return;
  }

  const saved = await globalThis.visualg.exportCode({
    content,
    fileName: files.getActiveFileName(),
  });
  if (saved) consoleView.write(`Código exportado: ${saved.filePath}`);
}

async function printCurrentSource() {
  const content = editor.value;
  if (!content.trim()) {
    consoleView.write("Código vazio, nada para imprimir.", true);
    return;
  }

  const result = await globalThis.visualg.printCode({
    content,
    title: files.getActiveFileName(),
  });

  if (result?.opened) {
    consoleView.write("Pré-visualização de impressão aberta.");
  } else {
    consoleView.write("Impressão cancelada.", true);
  }
}

function showFlowchart() {
  try {
    flowchartDialog.open(
      createFlowchart(editor.value),
      files.getActiveFileName(),
    );
  } catch (error) {
    flowchartDialog.showError(error.message);
  }
}

async function exportFlowchartSvg(svg, name) {
  const saved = await globalThis.visualg.exportFlowchartSvg({
    content: svg,
    fileName: flowchartExportName(name, "svg"),
  });
  if (saved) consoleView.write(`Fluxograma SVG exportado: ${saved.filePath}`);
}

async function exportFlowchartPng(svg, name) {
  const dataUrl = await svgToPngDataUrl(svg);
  const saved = await globalThis.visualg.exportFlowchartPng({
    dataUrl,
    fileName: flowchartExportName(name, "png"),
  });
  if (saved) consoleView.write(`Fluxograma PNG exportado: ${saved.filePath}`);
}

function handleGlobalShortcuts(event) {
  if (event.defaultPrevented || document.querySelector("dialog[open]")) return;

  if (event.ctrlKey && event.key === "w") {
    event.preventDefault();
    files.closeActiveTab();
    return;
  }

  if (event.ctrlKey && event.key === "Tab") {
    event.preventDefault();
    if (event.shiftKey) files.activatePreviousTab();
    else files.activateNextTab();
    return;
  }

  if (event.key === "F9") {
    event.preventDefault();
    runCurrentSource();
    return;
  }

  if (event.key === "F5") {
    event.preventDefault();
    debugCurrentSource();
    return;
  }

  if (event.key === "F8" && event.shiftKey) {
    event.preventDefault();
    debugPanel.previous();
    return;
  }

  if (event.key === "F8") {
    event.preventDefault();
    debugPanel.next();
  }
}

function indentCurrentSource() {
  editor.value = formatVisualg(editor.value, { tabSize: theme.getTabSize() });
  consoleView.write("Codigo indentado.");
}

async function debugCurrentSource() {
  if (!theme.isDebugPanelVisible()) {
    consoleView.write(
      "Painel de depuração desativado nas configurações.",
      true,
    );
    return;
  }

  debugPanel.clear();
  consoleView.write("Depuração iniciada.");
  try {
    const source = editor.value;
    const session = interpreterClient.createDebugSession(source, {
      onRead: inputDialog.createReader(),
      onReadFile: async (filePath) => {
        const targetPath = resolveFilePath(filePath);
        const result = await globalThis.visualg.openFilePath(targetPath);
        return result ? result.content : '';
      },
      breakpoints: editor.getBreakpoints(),
      ...theme.getRuntimeOptions(),
    });

    await debugPanel.setSession(session);
  } catch (error) {
    consoleView.write(error.message, true);
  }
}

function initAutoUpdater() {
  const checkBtn = document.querySelector("#checkForUpdatesButton");
  const downloadBtn = document.querySelector("#downloadUpdateButton");
  const installBtn = document.querySelector("#installUpdateButton");
  const statusText = document.querySelector("#updaterStatusText");
  const progressContainer = document.querySelector("#updaterProgressContainer");
  const progressBar = document.querySelector("#updaterProgressBar");
  const notesContainer = document.querySelector("#updaterReleaseNotes");

  if (!checkBtn || !globalThis.visualg?.updater) return;

  checkBtn.addEventListener("click", async () => {
    checkBtn.disabled = true;
    statusText.textContent = "Verificando atualizações...";
    clearReleaseNotes(notesContainer);
    const res = await globalThis.visualg.updater.check();
    checkBtn.disabled = false;
    if (!res.success) {
      statusText.textContent = `Erro ao verificar atualizações: ${res.error}`;
    } else if (res.result === null) {
      statusText.textContent = "O auto-updater está desativado em ambiente de desenvolvimento.";
    }
  });

  downloadBtn.addEventListener("click", async () => {
    downloadBtn.hidden = true;
    statusText.textContent = "Iniciando download...";
    const res = await globalThis.visualg.updater.download();
    if (!res.success) {
      statusText.textContent = `Erro ao baixar: ${res.error}`;
      downloadBtn.hidden = false;
    }
  });

  installBtn.addEventListener("click", () => {
    globalThis.visualg.updater.install();
  });

  globalThis.visualg.updater.onStatus((status) => {
    switch (status.state) {
      case "checking":
        statusText.textContent = "Verificando se há atualizações...";
        downloadBtn.hidden = true;
        installBtn.hidden = true;
        progressContainer.hidden = true;
        clearReleaseNotes(notesContainer);
        break;
      case "available":
        statusText.textContent = `Nova versão disponível: v${status.info.version}`;
        downloadBtn.hidden = false;
        installBtn.hidden = true;
        progressContainer.hidden = true;
        renderReleaseNotes(notesContainer, status.info);
        break;
      case "not-available":
        statusText.textContent = "Você já possui a versão mais recente instalada.";
        downloadBtn.hidden = true;
        installBtn.hidden = true;
        progressContainer.hidden = true;
        clearReleaseNotes(notesContainer);
        break;
      case "downloading":
        {
          const percent = Math.round(status.progress?.percent ?? 0);
          statusText.textContent = `Baixando atualização: ${percent}%`;
          progressContainer.hidden = false;
          if (progressBar) progressBar.style.width = `${percent}%`;
          downloadBtn.hidden = true;
          installBtn.hidden = true;
        }
        break;
      case "downloaded":
        statusText.textContent = `Nova versão v${status.info.version} baixada e pronta para instalar!`;
        downloadBtn.hidden = true;
        installBtn.hidden = false;
        progressContainer.hidden = true;
        break;
      case "error":
        statusText.textContent = `Erro de atualização: ${status.error}`;
        downloadBtn.hidden = true;
        installBtn.hidden = true;
        progressContainer.hidden = true;
        clearReleaseNotes(notesContainer);
        break;
      default:
        break;
    }
  });
}
