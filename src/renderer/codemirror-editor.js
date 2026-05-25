import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { copyLineDown, defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { Compartment, EditorState, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumberMarkers, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { BUILTINS, CONTROL_KEYWORDS, DECLARATION_KEYWORDS, LITERAL_KEYWORDS, TYPES } from '../interpreter/lexicon.js';
import { getVisualgCompletionOptions } from './visualg-completion.js';

export function createCodeMirrorEditor({ host, initialValue, extraKeymap = [], onUpdate }) {
  const lineWrappingCompartment = new Compartment();
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: initialValue,
      extensions: [
        breakpointField,
        lineNumbers({
          domEventHandlers: {
            mousedown(view, line, event) {
              event.preventDefault();
              view.dispatch({ effects: toggleBreakpoint.of(view.state.doc.lineAt(line.from).number) });
              return true;
            }
          }
        }),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        visualgLanguage(),
        syntaxHighlighting(visualgHighlightStyle),
        history(),
        autocompletion({ override: [visualgCompletions] }),
        keymap.of([
          indentWithTab,
          { key: 'Mod-d', run: copyLineDown },
          ...extraKeymap,
          ...completionKeymap,
          ...historyKeymap,
          ...defaultKeymap
        ]),
        lineWrappingCompartment.of(EditorView.lineWrapping),
        debugLineField,
        EditorView.updateListener.of((update) => {
          if (update.docChanged || update.selectionSet) onUpdate(update.view);
        }),
        visualgEditorTheme
      ]
    })
  });

  return {
    view,
    get value() {
      return view.state.doc.toString();
    },
    set value(nextValue) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: nextValue }
      });
      onUpdate(view);
    },
    focus() {
      view.focus();
    },
    highlightLine(lineNumber) {
      const line = getDocumentLine(view, lineNumber);
      if (!line) {
        this.clearDebugHighlight();
        return;
      }

      view.dispatch({
        effects: [
          setDebugLine.of(lineNumber),
          EditorView.scrollIntoView(line.from, { y: 'center' })
        ]
      });
    },
    clearDebugHighlight() {
      view.dispatch({ effects: setDebugLine.of(null) });
    },
    getBreakpoints() {
      return [...view.state.field(breakpointField).lines].sort((a, b) => a - b);
    },
    setLineWrapping(enabled) {
      view.dispatch({
        effects: lineWrappingCompartment.reconfigure(enabled ? EditorView.lineWrapping : [])
      });
    },
    find(query, options = {}) {
      return findOccurrence(view, query, { ...options, direction: 'current' });
    },
    findNext(query, options = {}) {
      return findOccurrence(view, query, { ...options, direction: 'next' });
    },
    findPrevious(query, options = {}) {
      return findOccurrence(view, query, { ...options, direction: 'previous' });
    },
    replaceCurrent(query, replacement, options = {}) {
      const state = view.state;
      const selection = state.selection.main;
      const selectedText = state.doc.sliceString(selection.from, selection.to);
      if (!matchesQuery(selectedText, query, options.caseSensitive)) {
        return findOccurrence(view, query, { ...options, direction: 'next' });
      }

      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: replacement },
        selection: { anchor: selection.from, head: selection.from + replacement.length }
      });
      return findOccurrence(view, query, { ...options, direction: 'next' });
    },
    replaceAll(query, replacement, options = {}) {
      if (!query) return { query, total: 0, current: 0, replaced: 0 };
      const value = view.state.doc.toString();
      const ranges = findAllRanges(value, query, options.caseSensitive);
      if (ranges.length === 0) return { query, total: 0, current: 0, replaced: 0 };
      view.dispatch({
        changes: ranges.map((range) => ({ from: range.from, to: range.to, insert: replacement }))
      });
      return { query, total: 0, current: 0, replaced: ranges.length };
    }
  };
}

const setDebugLine = StateEffect.define();
const toggleBreakpoint = StateEffect.define();

const debugLineField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (!effect.is(setDebugLine)) continue;
      const lineNumber = effect.value;
      if (lineNumber == null) return Decoration.none;
      const line = getDocumentLine(transaction.state, lineNumber);
      return line ? Decoration.set([Decoration.line({ class: 'cm-debugLine' }).range(line.from)]) : Decoration.none;
    }

    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field)
});

class BreakpointMarker extends GutterMarker {
  constructor(lineNumber) {
    super();
    this.lineNumber = lineNumber;
  }

  eq(other) {
    return other.lineNumber === this.lineNumber;
  }

  toDOM() {
    const wrapper = document.createElement('span');
    const dot = document.createElement('span');
    const number = document.createElement('span');
    wrapper.className = 'cm-breakpoint-line';
    wrapper.title = `Ponto de parada na linha ${this.lineNumber}`;
    dot.className = 'cm-breakpoint-dot';
    number.textContent = String(this.lineNumber);
    wrapper.append(dot, number);
    return wrapper;
  }
}

const breakpointField = StateField.define({
  create(state) {
    return buildBreakpointState(state, new Set());
  },
  update(value, transaction) {
    const lines = new Set([...value.lines].filter((lineNumber) => lineNumber <= transaction.state.doc.lines));

    for (const effect of transaction.effects) {
      if (!effect.is(toggleBreakpoint)) continue;
      const lineNumber = effect.value;
      if (lines.has(lineNumber)) {
        lines.delete(lineNumber);
      } else {
        lines.add(lineNumber);
      }
    }

    return buildBreakpointState(transaction.state, lines);
  },
  provide: (field) => lineNumberMarkers.from(field, (value) => value.markers)
});

function buildBreakpointState(state, lines) {
  const validLines = new Set([...lines].filter((lineNumber) => (
    Number.isInteger(lineNumber) && lineNumber >= 1 && lineNumber <= state.doc.lines
  )));
  const builder = new RangeSetBuilder();
  for (const lineNumber of [...validLines].sort((a, b) => a - b)) {
    const line = state.doc.line(lineNumber);
    builder.add(line.from, line.from, new BreakpointMarker(lineNumber));
  }
  return { lines: validLines, markers: builder.finish() };
}

function getDocumentLine(viewOrState, lineNumber) {
  const state = viewOrState.state ?? viewOrState;
  if (!Number.isInteger(lineNumber) || lineNumber < 1 || lineNumber > state.doc.lines) return null;
  return state.doc.line(lineNumber);
}

function findOccurrence(view, query, { caseSensitive = false, direction = 'next' } = {}) {
  if (!query) return { query, total: 0, current: 0 };
  const value = view.state.doc.toString();
  const ranges = findAllRanges(value, query, caseSensitive);
  if (ranges.length === 0) return { query, total: 0, current: 0 };

  const selection = view.state.selection.main;
  const selectedIndex = ranges.findIndex((range) => range.from === selection.from && range.to === selection.to);
  let nextIndex = selectedIndex;
  if (direction === 'next') {
    nextIndex = selectedIndex >= 0 ? selectedIndex + 1 : ranges.findIndex((range) => range.from >= selection.to);
    if (nextIndex < 0 || nextIndex >= ranges.length) nextIndex = 0;
  } else if (direction === 'previous') {
    nextIndex = selectedIndex >= 0 ? selectedIndex - 1 : lastIndexBefore(ranges, selection.from);
    if (nextIndex < 0) nextIndex = ranges.length - 1;
  } else if (nextIndex < 0) {
    nextIndex = ranges.findIndex((range) => range.from >= selection.from);
    if (nextIndex < 0) nextIndex = 0;
  }

  const range = ranges[nextIndex];
  view.dispatch({
    selection: { anchor: range.from, head: range.to },
    effects: EditorView.scrollIntoView(range.from, { y: 'center' })
  });
  return { query, total: ranges.length, current: nextIndex + 1 };
}

function findAllRanges(value, query, caseSensitive = false) {
  if (!query) return [];
  const haystack = caseSensitive ? value : value.toLocaleLowerCase();
  const needle = caseSensitive ? query : query.toLocaleLowerCase();
  const ranges = [];
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    ranges.push({ from: index, to: index + query.length });
    index = haystack.indexOf(needle, index + Math.max(needle.length, 1));
  }
  return ranges;
}

function lastIndexBefore(ranges, position) {
  for (let index = ranges.length - 1; index >= 0; index -= 1) {
    if (ranges[index].from < position) return index;
  }
  return -1;
}

function matchesQuery(value, query, caseSensitive = false) {
  if (!query) return false;
  return caseSensitive ? value === query : value.toLocaleLowerCase() === query.toLocaleLowerCase();
}

function visualgCompletions(context) {
  const word = context.matchBefore(/[a-zA-Z_\u00C0-\u017F][\w\u00C0-\u017F]*/);
  if (!word && !context.explicit) return null;

  return {
    from: word ? word.from : context.pos,
    options: getVisualgCompletionOptions(context.state.doc.toString())
  };
}

function visualgLanguage() {
  const keywordPattern = wordPattern(CONTROL_KEYWORDS);
  const typePattern = wordPattern([...TYPES, ...DECLARATION_KEYWORDS]);
  const builtinPattern = wordPattern(['leia', 'escreva', 'escreval', 'limpatela', ...BUILTINS]);
  const literalPattern = wordPattern(LITERAL_KEYWORDS);

  return StreamLanguage.define({
    token(stream) {
      if (stream.match(/\/\/.*/)) return 'comment';
      if (stream.match(/"(?:[^"\\]|\\.)*"/)) return 'string';
      if (stream.match(keywordPattern)) return 'keyword';
      if (stream.match(typePattern)) return 'typeName';
      if (stream.match(builtinPattern)) return 'variableName';
      if (stream.match(literalPattern)) return 'bool';
      if (stream.match(/\d+(?:\.\d+)?/)) return 'number';
      if (stream.match(/<-|:=|<>|<=|>=|[+\-*/=<>]/)) return 'operator';
      stream.next();
      return null;
    }
  });
}

function wordPattern(words) {
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'i');
}

const visualgHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--pink)', fontWeight: '700' },
  { tag: tags.typeName, color: 'var(--cyan)' },
  { tag: tags.variableName, color: 'var(--yellow)' },
  { tag: tags.string, color: '#ffb86c' },
  { tag: tags.number, color: 'var(--purple)' },
  { tag: tags.bool, color: 'var(--purple)' },
  { tag: tags.operator, color: 'var(--pink)' },
  { tag: tags.comment, color: 'var(--muted)', fontStyle: 'italic' }
]);

const visualgEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'var(--editor)',
    color: 'var(--text)',
    fontSize: 'var(--editor-font-size)'
  },
  '.cm-scroller': {
    fontFamily: 'var(--editor-font-family)',
    lineHeight: '1.55'
  },
  '.cm-content': {
    padding: '18px 0',
    caretColor: '#ffffff'
  },
  '.cm-line': {
    padding: '0 18px'
  },
  '.cm-line::before': {
    color: 'color-mix(in srgb, var(--line) 70%, transparent)'
  },
  '.cm-gutters': {
    backgroundColor: 'var(--panel-2)',
    color: 'var(--muted)',
    borderRight: '1px solid var(--line)'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    cursor: 'pointer'
  },
  '.cm-breakpoint-line': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '5px',
    minWidth: '100%',
    color: 'var(--text)'
  },
  '.cm-breakpoint-line .cm-breakpoint-dot': {
    display: 'block',
    width: '8px',
    height: '8px',
    margin: '0 auto',
    borderRadius: '999px',
    backgroundColor: 'var(--red)',
    boxShadow: '0 0 0 2px color-mix(in srgb, var(--red) 18%, transparent)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--purple) 18%, transparent)',
    color: 'var(--text)'
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--purple) 9%, transparent)'
  },
  '.cm-debugLine': {
    backgroundColor: 'color-mix(in srgb, var(--cyan) 28%, transparent)',
    boxShadow: 'inset 4px 0 0 var(--cyan)'
  },
  '.cm-cursor, .cm-dropCursor, &.cm-focused .cm-cursor': {
    borderLeftColor: '#ffffff !important'
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--purple) 32%, transparent)'
  },
  '.cm-tooltip': {
    border: '1px solid var(--line)',
    backgroundColor: 'var(--panel)',
    color: 'var(--text)'
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: '#0e639c',
    color: '#fff'
  }
});
