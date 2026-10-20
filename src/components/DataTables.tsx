import type { DataTable } from '../content/types'

// Tablas de ejemplo de SQL y Power BI. En el teléfono se desplazan de lado sin romper la página.
export function DataTables({ tables }: { tables?: DataTable[] }) {
  if (!tables?.length) return null
  return (
    <div className="data-tables">
      {tables.map((t) => (
        <figure key={t.name} className="data-table">
          <figcaption>{t.name}</figcaption>
          <div className="data-table__scroll">
            <table>
              <thead>
                <tr>{t.columns.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {t.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j} className={v === null ? 'is-null' : typeof v === 'number' ? 'is-num' : ''}>
                        {v === null ? 'NULL' : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      ))}
    </div>
  )
}
