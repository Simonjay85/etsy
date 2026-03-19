import { useState } from 'react'
import { Search, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { aiApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface KwRow {
  keyword: string
  search_volume: string
  competition: number
  trend: string
  rank?: string
}

const DEFAULT_KWS: KwRow[] = [
  { keyword: 'resume template ats',      search_volume: '~12k/mo', competition: 45, trend: 'rising',   rank: 'Top 15' },
  { keyword: 'cv template word a4',      search_volume: '~8k/mo',  competition: 68, trend: 'stable',   rank: 'Top 42' },
  { keyword: 'minimalist cv template',   search_volume: '~6k/mo',  competition: 38, trend: 'rising',   rank: 'Top 8'  },
  { keyword: 'modern resume template',   search_volume: '~45k/mo', competition: 91, trend: 'stable',   rank: '120+'   },
  { keyword: 'teacher resume template',  search_volume: '~5k/mo',  competition: 32, trend: 'rising',   rank: 'Top 20' },
]

export default function KeywordsPage() {
  const [kws, setKws]       = useState<KwRow[]>(DEFAULT_KWS)
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const { data } = await aiApi.analyzeKeyword(input.trim())
      setKws(prev => [{
        keyword:       data.keyword,
        search_volume: data.search_volume,
        competition:   data.competition,
        trend:         data.trend,
        rank:          'New',
      }, ...prev])
      setInput('')
      toast.success('Keyword analyzed!')
    } catch {
      // Fallback: add without AI data
      setKws(prev => [{ keyword: input.trim(), search_volume: '—', competition: 50, trend: 'stable' }, ...prev])
      setInput('')
    } finally {
      setLoading(false)
    }
  }

  const compColor = (c: number) => c < 50 ? 'text-green-400' : c < 75 ? 'text-amber-400' : 'text-red-400'
  const compBg    = (c: number) => c < 50 ? 'bg-green-500'  : c < 75 ? 'bg-amber-400'   : 'bg-red-500'

  return (
    <div className="max-w-4xl space-y-4">
      <div className="card">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="Enter a keyword to analyze..."
            className="input flex-1"
          />
          <button onClick={analyze} disabled={loading} className="btn-primary px-4 flex items-center gap-2">
            <Search size={14} />
            {loading ? 'Analyzing...' : '✦ AI Analyze'}
          </button>
          <button
            onClick={() => { setKws(prev => [{ keyword: input.trim(), search_volume: '—', competition: 50, trend: 'stable' }, ...prev]); setInput('') }}
            className="btn-ghost px-3"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-white/30 uppercase tracking-widest border-b border-white/[0.07]">
              <th className="text-left pb-3 font-normal">Keyword</th>
              <th className="text-left pb-3 font-normal">Search est.</th>
              <th className="text-left pb-3 font-normal">Competition</th>
              <th className="text-left pb-3 font-normal">Rank</th>
              <th className="text-left pb-3 font-normal">Trend</th>
            </tr>
          </thead>
          <tbody>
            {kws.map((k, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-bg-3 transition-colors">
                <td className="py-3 text-white">{k.keyword}</td>
                <td className="py-3 text-white/50">{k.search_volume}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-bg-4 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${compBg(k.competition)}`} style={{ width: `${k.competition}%` }} />
                    </div>
                    <span className={`text-xs ${compColor(k.competition)}`}>{k.competition}%</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    k.rank?.includes('8') || k.rank?.includes('15') ? 'bg-green-500/10 text-green-400'
                    : k.rank?.includes('120') ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    {k.rank ?? '—'}
                  </span>
                </td>
                <td className="py-3">
                  {k.trend === 'rising'   && <TrendingUp   size={14} className="text-green-400" />}
                  {k.trend === 'declining' && <TrendingDown size={14} className="text-red-400" />}
                  {k.trend === 'stable'   && <Minus        size={14} className="text-white/40" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
