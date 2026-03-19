import { useState } from 'react'
import { Download } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { THEMES } from '@/lib/constants'

const LAYOUTS = [
  { id: 'weekly',  label: 'Weekly',  desc: '52 weekly spreads · Mon–Sun grid',  pages: 52  },
  { id: 'monthly', label: 'Monthly', desc: '12 monthly calendar pages',          pages: 12  },
  { id: 'daily',   label: 'Daily',   desc: '365 daily pages · time blocks',      pages: 365 },
  { id: 'habit',   label: 'Habit',   desc: '12 habit tracker grids',             pages: 12  },
  { id: 'budget',  label: 'Budget',  desc: '12 budget + expense sheets',         pages: 12  },
  { id: 'notes',   label: 'Notes',   desc: 'Ruled note pages',                   pages: 50  },
]

export default function PlannerPage() {
  const [layout,     setLayout]     = useState('weekly')
  const [year,       setYear]       = useState(2025)
  const [themeId,    setThemeId]    = useState('midnight_navy')
  const [pageFormat, setPageFormat] = useState<'A4' | 'USLetter'>('A4')
  const [pages,      setPages]      = useState(52)
  const [loading,    setLoading]    = useState(false)

  const selLayout = LAYOUTS.find(l => l.id === layout)!
  const selTheme  = THEMES.find(t => t.id === themeId)!

  const generate = async () => {
    setLoading(true)
    try {
      const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
      const res = await fetch(`${API}/api/v1/planner/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout, year, pages, page_format: pageFormat, theme_id: themeId }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `Planner_${layout}_${themeId}_${year}.docx`
      })
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Planner downloaded!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-5 max-w-5xl">

      {/* ── Left: config ─────────────────────────────────────────── */}
      <div className="space-y-4">

        <div className="card">
          <h2 className="text-sm font-medium mb-3">1. Layout</h2>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUTS.map(l => (
              <button key={l.id} onClick={() => { setLayout(l.id); setPages(l.pages) }}
                className={clsx('text-left p-3 rounded-xl border transition-all',
                  layout === l.id ? 'border-accent/40 bg-accent/10' : 'border-white/[0.07] bg-bg-3 hover:bg-bg-4'
                )}>
                <div className={clsx('text-sm font-medium', layout === l.id ? 'text-accent' : 'text-white')}>
                  {l.label}
                </div>
                <div className="text-xs text-white/40 mt-0.5">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-medium mb-3">2. Color theme</h2>
          <div className="flex flex-wrap gap-2">
            {THEMES.slice(0, 8).map(t => (
              <button key={t.id} onClick={() => setThemeId(t.id)}
                className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs transition-all',
                  themeId === t.id ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/[0.07] text-white/45 hover:bg-bg-4'
                )}>
                <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-medium">3. Options</h2>
          <div>
            <label className="label">Year</label>
            <div className="flex gap-2">
              {[2025, 2026, 2027].map(y => (
                <button key={y} onClick={() => setYear(y)}
                  className={clsx('flex-1 py-2 rounded-lg border text-sm transition-all',
                    year === y ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/[0.07] text-white/45 hover:bg-bg-4'
                  )}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Page format</label>
            <div className="flex gap-2">
              {(['A4', 'USLetter'] as const).map(f => (
                <button key={f} onClick={() => setPageFormat(f)}
                  className={clsx('flex-1 py-2 rounded-lg border text-sm transition-all',
                    pageFormat === f ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/[0.07] text-white/45 hover:bg-bg-4'
                  )}>
                  {f === 'USLetter' ? 'US Letter' : 'A4'}
                </button>
              ))}
            </div>
          </div>
          {layout === 'notes' && (
            <div>
              <label className="label">Pages: {pages}</label>
              <input type="range" min={10} max={200} value={pages}
                onChange={e => setPages(Number(e.target.value))} className="w-full" />
            </div>
          )}
        </div>

        <button onClick={generate} disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Generating...</>
            : <><Download size={15} />Generate &amp; Download</>
          }
        </button>
      </div>

      {/* ── Right: preview + summary ─────────────────────────────── */}
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-sm font-medium mb-4">Preview</h2>
          <div className="aspect-[0.707] rounded-xl border overflow-hidden"
               style={{ borderColor: selTheme.color + '40' }}>
            <div className="h-[30%] px-5 py-4 flex flex-col justify-end"
                 style={{ background: selTheme.color + '22' }}>
              <div className="text-[9px] tracking-widest text-white/40 uppercase mb-1">{year}</div>
              <div className="text-base font-bold text-white">{selLayout.label.toUpperCase()} PLANNER</div>
              <div className="w-8 h-0.5 mt-1.5 rounded" style={{ background: selTheme.color }} />
            </div>
            <div className="p-4 space-y-2 bg-white/[0.02]">
              {layout === 'weekly' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} className="rounded border border-white/[0.08] p-2">
                      <div className="text-[7px] font-bold mb-1.5" style={{ color: selTheme.color }}>{d}</div>
                      {[0,1,2].map(i => <div key={i} className="h-px bg-white/10 mb-1.5" />)}
                    </div>
                  ))}
                </div>
              )}
              {layout === 'monthly' && (
                <div className="grid grid-cols-7 gap-0.5">
                  {['M','T','W','T','F','S','S'].map((d,i) => (
                    <div key={i} className="text-[6px] text-center py-1 rounded font-bold"
                         style={{ background: selTheme.color, color: '#fff' }}>{d}</div>
                  ))}
                  {[...Array(35)].map((_,i) => (
                    <div key={i} className="aspect-square rounded border border-white/[0.06] p-0.5">
                      <span className="text-[5px] text-white/30">{i < 31 ? i+1 : ''}</span>
                    </div>
                  ))}
                </div>
              )}
              {layout === 'habit' && (
                <div className="space-y-1.5">
                  {[...Array(7)].map((_,i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="text-[6px] text-white/30 w-10 shrink-0">Habit {i+1}</div>
                      {[...Array(12)].map((_,j) => (
                        <div key={j} className="w-3 h-3 rounded-full border border-white/20 text-center text-[6px] text-white/20 flex items-center justify-center">○</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {['daily','budget','notes'].includes(layout) && (
                <div className="space-y-2">
                  {[...Array(12)].map((_,i) => <div key={i} className="h-px bg-white/10" />)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card space-y-2.5 text-sm">
          {[
            { label: 'Layout',  value: selLayout.label },
            { label: 'Theme',   value: <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: selTheme.color }} />{selTheme.name}</span> },
            { label: 'Year',    value: year },
            { label: 'Format',  value: pageFormat },
            { label: 'Pages',   value: pages },
          ].map(row => (
            <div key={row.label} className="flex justify-between">
              <span className="text-white/40">{row.label}</span>
              <span className="text-white">{row.value}</span>
            </div>
          ))}
          <div className="border-t border-white/[0.07] pt-2 flex justify-between">
            <span className="text-white/40">Output</span>
            <span className="text-[11px] font-mono text-white/60">
              Planner_{layout}_{themeId}_{year}.docx
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
