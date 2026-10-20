import { useEffect, useState } from 'react'
import { Learn } from './screens/Learn'
import { Session } from './screens/Session'
import { Playground } from './screens/Playground'
import { Profile } from './screens/Profile'
import { Bolt, Code, Flame, Path, User } from './components/Icons'
import { useProgress } from './progress/store'
import { getPythonRunner } from './engine/pythonRunner'
import { APP_NAME } from './brand'
import { applyUpdate, onUpdateReady } from './pwa/register'
import { AuthSheet } from './components/AuthSheet'
import { trackScreen } from './cloud/firebase'

type Tab = 'learn' | 'playground' | 'profile'
type Route = { name: Tab } | { name: 'session'; ids: string[]; title: string }

const TABS: { id: Tab; label: string; icon: () => React.ReactElement }[] = [
  { id: 'learn', label: 'Aprender', icon: () => <Path /> },
  { id: 'playground', label: 'Libre', icon: () => <Code /> },
  { id: 'profile', label: 'Perfil', icon: () => <User /> },
]

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'learn' })
  const p = useProgress()
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => onUpdateReady(setUpdateReady), [])

  // Carga Python en segundo plano apenas abre la app, para que el primer "Ejecutar" sea instantáneo.
  useEffect(() => {
    getPythonRunner().ready()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    trackScreen(route.name)
  }, [route])

  if (route.name === 'session') {
    return (
      <>
        <Session key={route.ids.join()} ids={route.ids} title={route.title} onExit={() => setRoute({ name: 'learn' })} />
        <AuthSheet />
      </>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" />
          {APP_NAME}
        </div>
        <span className={`chip chip--streak ${p.streak > 0 ? 'is-active' : ''}`} title="Días seguidos practicando">
          <Flame size={16} /> {p.streak}
        </span>
        <span className="chip chip--xp" title="Experiencia total">
          <Bolt size={16} /> {p.xp}
        </span>
      </header>

      <main>
        {route.name === 'learn' && <Learn onStart={(ids, title) => setRoute({ name: 'session', ids, title })} />}
        {route.name === 'playground' && <Playground />}
        {route.name === 'profile' && <Profile />}
      </main>

      {updateReady && (
        <div className="update" role="status">
          <span>¡Hay una versión nueva de {APP_NAME}!</span>
          <button className="btn btn--energy btn--sm" onClick={applyUpdate}>Actualizar</button>
        </div>
      )}

      <AuthSheet />

      <nav className="nav" aria-label="Navegación principal">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav__item ${route.name === t.id ? 'is-active' : ''}`}
            aria-current={route.name === t.id ? 'page' : undefined}
            onClick={() => setRoute({ name: t.id })}
          >
            {t.icon()}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
