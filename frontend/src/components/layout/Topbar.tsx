import { useLocation } from 'react-router-dom'

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Dashboard',         sub: 'Overview of your shop' },
  '/upload':    { title: 'Upload & Generate', sub: 'Upload .docx → create color + font variants' },
  '/planner':   { title: 'Digital Planner',   sub: 'Build multi-page planners with python-docx' },
  '/thumbnail': { title: 'Thumbnails',        sub: 'Generate Etsy 2000×2000 listing images' },
  '/listings':  { title: 'Listings & SEO',    sub: 'AI-powered Etsy listing editor' },
  '/keywords':  { title: 'Keyword Tracker',   sub: 'Monitor rankings and competition' },
  '/shop':      { title: 'Shop Analytics',    sub: 'Etsy performance overview' },
  '/settings':  { title: 'Settings',          sub: 'API keys, Etsy OAuth, storage config' },
}

export default function Topbar() {
  const { pathname } = useLocation()
  const meta = PAGE_META[pathname] ?? { title: 'CV Studio', sub: '' }

  return (
    <header className="h-14 bg-bg-2 border-b border-white/[0.07] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-[15px] font-medium text-white">{meta.title}</h1>
        {meta.sub && <p className="text-xs text-white/35">{meta.sub}</p>}
      </div>
      <span className="text-[9px] bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded-full">
        ✦ Claude Powered
      </span>
    </header>
  )
}
