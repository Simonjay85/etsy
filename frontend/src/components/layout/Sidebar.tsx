import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Upload, BookOpen, Tag,
  Search, Store, Image, Settings
} from 'lucide-react'
import { clsx } from 'clsx'
import { useServerStatus } from '@/hooks/useServerStatus'

const NAV = [
  { group: 'Overview', items: [
    { to: '/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
  ]},
  { group: 'Create', items: [
    { to: '/upload',     label: 'Upload & Generate',  icon: Upload,   badge: 'NEW' },
    { to: '/planner',    label: 'Digital Planner',    icon: BookOpen },
    { to: '/thumbnail',  label: 'Thumbnails',         icon: Image,    badge: 'AI' },
  ]},
  { group: 'Etsy', items: [
    { to: '/listings',   label: 'Listings & SEO',     icon: Tag,      badge: 'AI' },
    { to: '/keywords',   label: 'Keyword Tracker',    icon: Search },
    { to: '/shop',       label: 'Shop Analytics',     icon: Store },
  ]},
  { group: 'System', items: [
    { to: '/settings',   label: 'Settings',           icon: Settings },
  ]},
]

export default function Sidebar() {
  const { connected } = useServerStatus()

  return (
    <aside className="w-[220px] min-w-[220px] bg-bg-2 border-r border-white/[0.07] flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-6 border-b border-white/[0.07]">
        <div className="font-serif text-xl text-accent">CV Studio</div>
        <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
          Etsy Template Manager
        </div>
      </div>

      <nav className="flex-1 py-4 px-3">
        {NAV.map(({ group, items }) => (
          <div key={group} className="mb-5">
            <div className="text-[9px] text-white/25 uppercase tracking-widest px-2 mb-2">
              {group}
            </div>
            {items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm mb-0.5 transition-all',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-white/50 hover:bg-bg-3 hover:text-white'
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={clsx(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                    badge === 'AI' ? 'bg-accent text-bg' : 'bg-blue-500/20 text-blue-400'
                  )}>{badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'
          )} />
          {connected ? 'Server running' : 'Server offline'}
        </div>
      </div>
    </aside>
  )
}
