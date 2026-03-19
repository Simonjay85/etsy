import { useNavigate } from 'react-router-dom'
import { Upload, Tag, Search, Download, ArrowRight } from 'lucide-react'

const STATS = [
  { label: 'Templates',     value: '0',  delta: 'Upload your first' },
  { label: 'Listings',      value: '0',  delta: 'Generate listings' },
  { label: 'SEO score avg', value: '—',  delta: 'Create listings first' },
  { label: 'Revenue (USD)', value: '$0', delta: 'Connect Etsy to track' },
]

const ACTIONS = [
  {
    to: '/upload',
    icon: Upload,
    title: 'Upload & Generate',
    desc: 'Upload any .docx → create color + font variants',
    accent: true,
  },
  {
    to: '/listings',
    icon: Tag,
    title: 'Create Etsy listings',
    desc: 'AI writes title, description, 13 tags',
  },
  {
    to: '/keywords',
    icon: Search,
    title: 'Track keywords',
    desc: 'Monitor competition and ranking',
  },
]

export default function DashboardPage() {
  const nav = useNavigate()

  return (
    <div className="max-w-5xl space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="card">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-3xl font-serif text-white font-light">{s.value}</p>
            <p className="text-xs text-white/35 mt-1">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-sm font-medium mb-4">Quick actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map(a => (
            <button
              key={a.to}
              onClick={() => nav(a.to)}
              className={`text-left p-4 rounded-xl border transition-all group ${
                a.accent
                  ? 'border-accent/25 bg-accent/5 hover:bg-accent/10'
                  : 'border-white/[0.07] bg-bg-3 hover:bg-bg-4'
              }`}
            >
              <a.icon size={20} className={`mb-3 ${a.accent ? 'text-accent' : 'text-white/50'}`} />
              <p className={`text-sm font-medium mb-1 ${a.accent ? 'text-accent' : 'text-white'}`}>
                {a.title}
              </p>
              <p className="text-xs text-white/40">{a.desc}</p>
              <ArrowRight
                size={14}
                className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/50"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Getting started checklist */}
      <div className="card">
        <h2 className="text-sm font-medium mb-4">Getting started</h2>
        <div className="space-y-3">
          {[
            { done: false, label: 'Upload your first .docx template', action: () => nav('/upload') },
            { done: false, label: 'Generate color variants', action: () => nav('/upload') },
            { done: false, label: 'Create Etsy listings with AI', action: () => nav('/listings') },
            { done: false, label: 'Connect Etsy API in Settings', action: () => nav('/settings') },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-3 cursor-pointer hover:bg-bg-4 transition-colors group"
              onClick={step.action}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                step.done ? 'bg-green-500 border-green-500' : 'border-white/20 group-hover:border-accent/50'
              }`}>
                {step.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
              <span className="text-sm text-white/70 flex-1">{step.label}</span>
              <ArrowRight size={14} className="text-white/25 group-hover:text-white/50 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
