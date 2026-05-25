# Visualg Electron Design

## Goal

Rebuild the Visualg 3.0.7 experience as a modern Electron desktop app with a Dracula-themed IDE and a Node-based interpreter for a practical subset of `.alg` programs.

## Source Context

The original folder at `C:\Users\elvis\Downloads\visualg3.0.7\visualg3.0.7` is a release distribution, not source code. It contains `visualg30.exe`, HTML/CHM help, skins, a PDF menu guide, and many `.alg` example programs. The new project will copy useful examples into the workspace and will not modify the original installation.

## Product Scope

The first version is an Electron IDE with:

- Dracula visual theme.
- Top app chrome with common commands.
- Left sidebar listing bundled examples.
- Central `.alg` editor.
- Bottom console with program output, runtime errors, and an input box for `leia`.
- Local open/save support through Electron dialogs.
- A Node interpreter that executes a useful Visualg subset.

## Language Scope

Initial interpreter support:

- `algoritmo`, `var`, `inicio`, `fimalgoritmo`.
- Scalar declarations for `inteiro`, `real`, `caracter`/`caractere`, and `logico`.
- Comments with `//`.
- Assignment with `<-` and `:=`.
- `escreva` and `escreval`.
- `leia`.
- `se`, `senao`, `fimse`.
- `para`, `fimpara`.
- `enquanto`, `fimenquanto`.
- Arithmetic and comparison expressions.

Deferred compatibility:

- Records, vectors, procedures, functions, file IO, random mode, debugger stepping, and full Visualg formatting width syntax.

## Architecture

The Electron shell owns desktop capabilities and isolates file access in preload APIs. The renderer owns the IDE layout and editor interactions. The interpreter is plain JavaScript under `src/interpreter`, split into tokenizer, parser, runtime, and built-ins so it can be tested without Electron.

## Testing

Core interpreter behavior must be covered with Node tests before UI integration. The Electron UI can be verified manually at first by starting the app, loading a simple sample, running it, and checking the console output.

## Acceptance Criteria

- The workspace contains a runnable Electron project.
- The app uses a Dracula-style layout.
- The user can load a bundled `.alg` example.
- The user can type or edit code and run it.
- Simple programs using variables, output, input, conditionals, loops, and expressions execute in the console.
