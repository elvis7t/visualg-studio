# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`visualg-electron-modern` — a modern Dracula-themed Electron rebuild of Visualg (a Brazilian pseudocode learning environment). Pure JavaScript, Node ES modules throughout. No TypeScript, no framework.

## Commands

- `npm start` — bundle the renderer and launch Electron.
- `npm test` — run the Node built-in test suite (`node --test`) over `test/*.test.js`.
- `npm run test:watch` — same in watch mode.
- `npm run check` — `node --check` syntax pass over every `.js`/`.cjs` under `src/`, `test/`, `scripts/` (see `scripts/check-syntax.js`).
- `npm run verify` — `npm test && npm run check`. Run this before claiming work is complete.
- `npm run build:renderer` — esbuild bundles `src/renderer/app.js` → `src/renderer/bundle.js`. **Required after editing anything in `src/renderer/`** (Electron loads the bundle, not the source). `npm start`, `npm run pack*`, and `npm run dist*` all run this first.
- Single test: `node --test test/interpreter.test.js` (or any specific file). Filter within a file with `node --test --test-name-pattern="conditional" test/interpreter.test.js`.
- Packaging: `npm run pack` / `pack:win` (unpacked), `npm run dist` / `dist:win` (NSIS installer). Output goes to `dist/`.

## Architecture

Three layers communicating through narrow boundaries (IPC for OS access, `postMessage` for the interpreter Worker):

**`src/interpreter/`** — Pure JS Visualg implementation. No DOM, no Electron, no I/O. Pipeline:
- `tokenizer.js` strips comments, splits args, normalizes Portuguese keywords (NFD + lowercase, so `início` ≡ `inicio`). `lexicon.js` holds the keyword/operator tables.
- `parser.js` produces `{ declarations, statements, subprograms }` AST. Types: `inteiro`, `real`, `caracter`/`caractere`, `logico`, plus `vetor [a..b] de tipo`. Subprograms (`procedimento`/`funcao`) parse into a separate list.
- `runtime.js` defines `Runtime`, which owns `scopes` (stack), `output`, `steps`, `subprograms`, and an `executionState` (input queue / `onRead` callback / random mode / loop guard). Execution work is split across focused modules: `expressions.js`, `runtime-commands.js`, `declarations.js`, `scope-bindings.js`, `variable-access.js`, `vectors.js`, `subprograms.js`, `choice-runtime.js`, `native-functions.js`, `control-signals.js`, `debug-snapshot.js`, `runtime-snapshot.js`, `output-format.js`, `execution-state.js`, `command-suggestions.js`. Stdin is either pre-supplied via `options.input` (array of strings) or pulled lazily via `options.onRead(request)` returning a string/Promise.
- `debug-session.js` exposes two shapes:
  - `createHeadlessDebugSession` — pre-records the full step trace via `runVisualg({ debug: true })`, then walks it (used by the legacy `createDebugSession` export and by automation tests).
  - `createInteractiveSession` — drives the runtime in the background, pausing on every step via an `onDebugStep` await so the UI can step/continue/stop and so `leia()` can call back into the host for input. This is the production debug path.
- `index.js` is the public API: `runVisualg`, `debugVisualg`, `createInteractiveDebugSession`, `evaluateWatchExpression`, `collectReadVariables` (re-exported from `analysis.js`, static scan of `leia(...)` for the input dialog), and the deprecated `createDebugSession` (kept for tests/automation).
- `formatter.js` (indenter) and `flowchart.js` (parser → SVG-friendly graph) are companion tools that also reuse the parser; they do not touch the runtime.
- `worker-protocol.js` defines the message constants and request/response factories shared between `interpreter-worker.js` and `worker-client.js` — interpreter side has no DOM/Electron dependency.

**`src/main/`** — Electron main process (ESM). `main.js` creates the window and registers IPC handlers for files, examples, console export, code export/print, and flowchart SVG/PNG export. `preload.cjs` is **CommonJS by necessity** (Electron preload requirement) and exposes `window.visualg`: `listExamples`, `readExample`, `openFile`, `openFilePath`, `saveFile`, `exportConsole`, `exportCode`, `printCode`, `exportFlowchartSvg`, `exportFlowchartPng`. `examples.js` reads `.alg` files from `examples/`. `code-output.js` builds the print-preview HTML.

**`src/renderer/`** — Vanilla-JS modules bundled by esbuild. Each `create*` function returns a controller object (closure-based, no classes for UI). `app.js` wires the controllers: `createCodeMirrorEditor` (CodeMirror 6 with a Visualg StreamLanguage + Dracula highlight style, `visualg-completion.js` for autocomplete), `createEditorController`, `createConsoleView`, `createDebugPanel`, `createInputDialog`, `createFileController` (multi-tab + recent files), `createPanelResizer` / `createEditorResizer` / `createDebugSideResizer`, `createThemeController`, `createSearchPanel`, `createDocsDialog`, `createFlowchartDialog`. Talks to the OS only through `window.visualg`.

**Interpreter Worker.** `app.js` constructs an `Interpreter Worker Client` (`worker-client.js`) wrapping a Web Worker (`interpreter-worker.js`). `runVisualg` / `createInteractiveDebugSession` are invoked across the worker boundary via the `worker-protocol.js` messages. `leia()` round-trips: the worker posts a `READ_REQUEST`, the client invokes the host `onRead` (the input dialog), and posts the value back as `READ_RESPONSE`. If the `Worker` global is missing or the options payload is non-cloneable, the client falls back to running the interpreter in-thread (`fallbackRun` / `fallbackDebug`).

## Conventions

- ES modules (`"type": "module"`) everywhere except `preload.cjs`.
- Plain JavaScript only — match the existing style; do not introduce TypeScript, JSX, or build steps beyond the existing esbuild call.
- Renderer changes only take effect after `build:renderer`; if behavior in the running app doesn't match the source, the bundle is stale. **Exception:** `interpreter-worker.js` is referenced via `new URL('./interpreter-worker.js', import.meta.url)` and loaded directly from `src/renderer/` at runtime as a native ES module — esbuild leaves the URL literal in the bundle but does not inline the worker, so worker edits take effect without rebuild (but its `../interpreter/*` imports still resolve to source files on disk).
- Keep interpreter behavior covered by focused `node --test` tests in `test/`. The suite covers each interpreter module plus `worker-client.js`, `worker-entry.test.js` (the worker message handler), and `worker-protocol.js`.
- Do not edit generated output under `dist/` unless the task is explicitly about packaged artifacts.
- UI styling stays consistent with the Dracula theme in `src/renderer/styles.css` and the highlight style in `codemirror-editor.js`.

## Environment

- This workspace may not be a git repository (`AGENTS.md` notes this). Verify before relying on git operations.
- Windows host; shell is PowerShell. If sandboxing blocks a command, ask before rerunning unsandboxed.
