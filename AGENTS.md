# AGENTS.md

## Project Overview

This is `visualg-electron-modern`, a modern Electron rebuild of Visualg.

The app is a Node/Electron project using ES modules.

## Useful Commands

- `npm start` - run the Electron app locally.
- `npm test` - run the Node test suite.
- `npm run test:watch` - run tests in watch mode.
- `npm run pack` - build an unpacked Electron app.
- `npm run pack:win` - build an unpacked Windows app.
- `npm run dist` - create distributable builds.
- `npm run dist:win` - create the Windows distributable.

## Project Structure

- `src/interpreter/` - Visualg tokenizer, parser, runtime, and interpreter API.
- `src/main/` - Electron main process, preload, and bundled example loading.
- `src/renderer/` - renderer HTML, CSS, and UI logic.
- `examples/` - bundled Visualg examples.
- `resources/` - build resources such as icons.
- `test/` - Node test files.
- `dist/` - generated build output.

## Development Notes

- Prefer the existing plain JavaScript style and ES module imports.
- Keep interpreter behavior covered by focused `node --test` tests.
- Do not edit generated build output in `dist/` unless the task is explicitly about packaged artifacts.
- Keep UI changes consistent with the current Dracula-themed renderer.
- Before claiming a code change is complete, run `npm test` when practical.

## Environment Notes

- This workspace may not be initialized as a git repository.
- If shell sandboxing fails on Windows, request permission before rerunning important commands outside the sandbox.
