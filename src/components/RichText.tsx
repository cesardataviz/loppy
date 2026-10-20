import { Fragment, type ReactNode } from 'react'

// Mini renderizador: párrafos, ```bloques```, `código` en línea y **negrita**.
export function RichText({ text }: { text: string }) {
  const parts = text.split(/```\n?([\s\S]*?)```/g)
  return (
    <div className="rich">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i}>{part.replace(/\n$/, '')}</pre>
        ) : (
          part
            .split(/\n{1,}/)
            .filter((p) => p.trim())
            .map((p, j) => <p key={`${i}-${j}`}>{inline(p)}</p>)
        ),
      )}
    </div>
  )
}

function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((t, i) => {
    if (t.startsWith('`')) return <code key={i}>{t.slice(1, -1)}</code>
    if (t.startsWith('**')) return <strong key={i}>{t.slice(2, -2)}</strong>
    return <Fragment key={i}>{t}</Fragment>
  })
}
