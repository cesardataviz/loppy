import { useMemo, useRef } from 'react'
import CodeMirror, { EditorView, keymap, type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { indentUnit } from '@codemirror/language'
import { python } from '@codemirror/lang-python'
import { EditorState, Prec, Transaction } from '@codemirror/state'
import { tags as t } from '@lezer/highlight'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import './CodeEditor.css'

interface Props {
  value: string
  onChange: (v: string) => void
  onRun?: () => void
  minHeight?: number
}

// Atajos de símbolos difíciles de escribir en un teclado de móvil.
const SYMBOLS: { label: string; insert: string; back?: number }[] = [
  { label: '⇥', insert: '    ' },
  { label: '( )', insert: '()', back: 1 },
  { label: ':', insert: ':' },
  { label: '" "', insert: '""', back: 1 },
  { label: '[ ]', insert: '[]', back: 1 },
  { label: '{ }', insert: '{}', back: 1 },
  { label: '=', insert: ' = ' },
  { label: '==', insert: ' == ' },
  { label: '+', insert: ' + ' },
  { label: '%', insert: ' % ' },
  { label: 'print', insert: 'print()', back: 1 },
  { label: 'for', insert: 'for i in range():', back: 2 },
  { label: 'if', insert: 'if :', back: 1 },
]

// iOS (y algunos teclados) cambia " por “ ” al escribir, y Python no entiende esas comillas.
// Este filtro las convierte en comillas rectas en el momento.
const SMART_QUOTES = /[“”„‘’‚]/
const straightQuotes = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged || !tr.isUserEvent('input')) return tr
  let found = false
  tr.changes.iterChanges((_fa, _ta, _fb, _tb, text) => {
    if (SMART_QUOTES.test(text.toString())) found = true
  })
  if (!found) return tr
  const changes: { from: number; to: number; insert: string }[] = []
  tr.changes.iterChanges((from, to, _fb, _tb, text) => {
    changes.push({ from, to, insert: text.toString().replace(/[“”„]/g, '"').replace(/[‘’‚]/g, "'") })
  })
  return {
    changes,
    selection: tr.selection,
    effects: tr.effects,
    scrollIntoView: tr.scrollIntoView,
    userEvent: tr.annotation(Transaction.userEvent),
  }
})

const loppyTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--night)', color: '#E2E8F0', fontSize: '16px' },
    '.cm-content': { fontFamily: 'var(--mono)', caretColor: '#FACC15', padding: '12px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#FACC15', borderLeftWidth: '2px' },
    '.cm-gutters': { backgroundColor: 'var(--night)', color: '#475569', border: 'none' },
    '.cm-activeLine': { backgroundColor: 'rgb(59 130 246 / .08)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#94A3B8' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgb(139 92 246 / .35) !important' },
    '.cm-matchingBracket': { backgroundColor: 'rgb(250 204 21 / .2)', outline: 'none' },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true },
)

const loppyHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.operatorKeyword], color: '#C4B5FD', fontWeight: '600' },
  { tag: [t.string, t.special(t.string)], color: '#FDE68A' },
  { tag: [t.number, t.bool, t.null], color: '#F9A8D4' },
  { tag: [t.comment], color: '#64748B', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#93C5FD' },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: '#67E8F9' },
  { tag: [t.operator, t.punctuation], color: '#CBD5E1' },
])

export function CodeEditor({ value, onChange, onRun, minHeight = 220 }: Props) {
  const ref = useRef<ReactCodeMirrorRef>(null)
  const runRef = useRef(onRun)
  runRef.current = onRun

  const extensions = useMemo(
    () => [
      python(),
      straightQuotes,
      indentUnit.of('    '),
      syntaxHighlighting(loppyHighlight),
      EditorView.lineWrapping,
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (runRef.current?.(), true) }])),
    ],
    [],
  )

  function insert(text: string, back = 0) {
    const view = ref.current?.view
    if (!view) return
    const { from, to } = view.state.selection.main
    view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length - back } })
    view.focus()
  }

  return (
    <div className="editor">
      <CodeMirror
        ref={ref}
        value={value}
        onChange={onChange}
        theme={loppyTheme}
        extensions={extensions}
        minHeight={`${minHeight}px`}
        basicSetup={{ autocompletion: false, foldGutter: false, highlightActiveLine: true, searchKeymap: false }}
        aria-label="Editor de código"
      />
      <div className="symbols" role="toolbar" aria-label="Insertar símbolo">
        {SYMBOLS.map((s) => (
          <button key={s.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s.insert, s.back)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
