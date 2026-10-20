import './Loppy.css'

export type LoppyMood = 'idle' | 'thinking' | 'success' | 'error'

interface Props {
  mood?: LoppyMood
  streak?: number
  size?: number
}

// Nivel visual de la racha: bandana y aura cambian según los días seguidos.
export function streakTier(streak: number): 'none' | 'violet' | 'gold' | 'glow' | 'rainbow' {
  if (streak >= 30) return 'rainbow'
  if (streak >= 7) return 'glow'
  if (streak >= 3) return 'gold'
  if (streak >= 1) return 'violet'
  return 'none'
}

export function Loppy({ mood = 'idle', streak = 0, size = 140 }: Props) {
  const tier = streakTier(streak)
  const tangled = mood === 'error'

  return (
    <div
      className={`loppy loppy--${mood} loppy--tier-${tier}`}
      style={{ width: size, height: size * 0.8 }}
      role="img"
      aria-label={`Loppy ${moodLabel[mood]}`}
    >
      {tier !== 'none' && <div className="loppy__aura" />}
      <svg viewBox="0 0 200 160" className="loppy__svg">
        <g className="loppy__body">
          {/* Patitas */}
          <g className="loppy__legs">
            <path className="loppy__leg loppy__leg--l" d={tangled ? 'M78 118 q14 18 28 26' : 'M66 118 v22'} />
            <path className="loppy__leg loppy__leg--r" d={tangled ? 'M122 118 q-14 18 -28 26' : 'M134 118 v22'} />
          </g>

          {/* Cuerpo: lazo infinito elástico */}
          <path
            className="loppy__loop"
            d="M100 80c-18-26-36-40-54-40-22 0-40 18-40 40s18 40 40 40c18 0 36-14 54-40zm0 0c18 26 36 40 54 40 22 0 40-18 40-40s-18-40-40-40c-18 0-36 14-54 40z"
          />

          {/* Bandana de racha */}
          {tier !== 'none' && (
            <g className="loppy__bandana">
              <path d="M30 52 Q100 22 170 52 L166 62 Q100 34 34 62 Z" />
              <path d="M168 56 l16 -6 l-4 12 z" />
            </g>
          )}

          {/* Cara */}
          <g className="loppy__face">
            {tangled ? (
              <>
                <path className="loppy__swirl" d="M38 80 a8 8 0 1 1 8 8 a4 4 0 1 1 -4 -4" />
                <path className="loppy__swirl" d="M154 80 a8 8 0 1 1 8 8 a4 4 0 1 1 -4 -4" />
                <path className="loppy__mouth" d="M88 104 q4 -5 8 0 q4 5 8 0 q4 -5 8 0" />
              </>
            ) : (
              <>
                <g className="loppy__eye">
                  <ellipse cx="46" cy="78" rx="12" ry="14" fill="#F8FAFC" />
                  <circle className="loppy__pupil" cx="48" cy="80" r="6" fill="#0F172A" />
                  <circle cx="50" cy="76" r="2" fill="#F8FAFC" />
                </g>
                <g className="loppy__eye">
                  <ellipse cx="154" cy="78" rx="12" ry="14" fill="#F8FAFC" />
                  <circle className="loppy__pupil" cx="152" cy="80" r="6" fill="#0F172A" />
                  <circle cx="154" cy="76" r="2" fill="#F8FAFC" />
                </g>
                <path
                  className="loppy__mouth"
                  d={mood === 'success' ? 'M86 98 q14 18 28 0 z' : 'M90 100 q10 9 20 0'}
                />
              </>
            )}
          </g>
        </g>

        {/* Chispas de colores al acertar */}
        {mood === 'success' && (
          <g className="loppy__sparks">
            {sparks.map((s, i) => (
              <circle key={i} cx="100" cy="80" r={s.r} fill={s.c} style={{ '--dx': `${s.x}px`, '--dy': `${s.y}px` } as React.CSSProperties} />
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}

const moodLabel: Record<LoppyMood, string> = {
  idle: 'esperando',
  thinking: 'ejecutando tu código',
  success: 'celebrando',
  error: 'enredado, pero tranquilo',
}

const sparkColors = ['#FACC15', '#8B5CF6', '#3B82F6', '#F472B6', '#34D399']
const sparks = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  const dist = 70 + (i % 3) * 14
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, r: 3 + (i % 3), c: sparkColors[i % sparkColors.length] }
})
