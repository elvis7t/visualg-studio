# Visualg Electron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Dracula-themed Electron IDE that can edit and run a useful subset of Visualg `.alg` programs.

**Architecture:** The app is split between an Electron main process, a preload bridge, a renderer UI, and a plain Node interpreter. The interpreter is dependency-free and testable through Node's built-in test runner.

**Tech Stack:** Electron, Node.js, browser JavaScript, CSS, Node `node:test`.

---

## File Structure

- `package.json`: npm scripts and Electron dependency.
- `src/main/main.js`: Electron window creation and dialog/file IPC.
- `src/main/preload.js`: safe renderer API bridge.
- `src/renderer/index.html`: app shell.
- `src/renderer/styles.css`: Dracula UI.
- `src/renderer/app.js`: editor, examples, console, and run actions.
- `src/interpreter/tokenizer.js`: converts Visualg source to tokens.
- `src/interpreter/parser.js`: builds AST.
- `src/interpreter/runtime.js`: executes AST.
- `src/interpreter/index.js`: public `runVisualg` API.
- `test/interpreter.test.js`: interpreter tests.
- `examples/*.alg`: bundled starter examples copied from the original distribution.

## Tasks

### Task 1: Project Scaffold

- [ ] Create `package.json` with `start`, `test`, and `test:watch` scripts.
- [ ] Create the Electron main, preload, renderer HTML, renderer JS, and CSS files.
- [ ] Create a basic Dracula app shell that can render without the interpreter.

### Task 2: Interpreter Red Cycle

- [ ] Create `test/interpreter.test.js` with tests for output, variables, conditionals, loops, and input.
- [ ] Run `npm test` and confirm the tests fail because `runVisualg` is missing.

### Task 3: Interpreter Green Cycle

- [ ] Implement tokenizer, parser, runtime, and public `runVisualg`.
- [ ] Run `npm test` and confirm interpreter tests pass.

### Task 4: UI Integration

- [ ] Connect the renderer to `runVisualg`.
- [ ] Add editor actions for new, open, save, and run.
- [ ] Add bundled examples and an example loader.
- [ ] Show output, errors, and requested input in the console panel.

### Task 5: Verification

- [ ] Run `npm test`.
- [ ] Run an Electron dependency availability check.
- [ ] If Electron is installed, start the app; otherwise report the exact install command needed.
