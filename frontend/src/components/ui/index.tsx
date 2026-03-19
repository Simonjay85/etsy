/**
 * Shared UI primitives
 * Usage: import { Button, Card, Badge } from '@/components/ui'
 */
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ReactNode, ButtonHTMLAttributes } from 'react'


// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
  icon?:    ReactNode
}

export function Button({
  variant = 'ghost', size = 'md', loading, icon,
  children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all rounded-lg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          primary: 'bg-accent text-bg hover:bg-accent-light',
          ghost:   'border border-white/[0.13] bg-bg-3 text-white/60 hover:bg-bg-4 hover:text-white',
          danger:  'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
          success: 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20',
        }[variant],
        { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' }[size],
        className,
      )}
    >
      {loading
        ? <Loader2 size={{ sm:12, md:14, lg:16 }[size]} className="animate-spin" />
        : icon
      }
      {children}
    </button>
  )
}


// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children:   ReactNode
  className?: string
  accent?:    boolean   // gold border tint
}

export function Card({ children, className, accent }: CardProps) {
  return (
    <div className={clsx(
      'bg-bg-2 rounded-xl p-5',
      accent
        ? 'border border-accent/25 bg-accent/[0.03]'
        : 'border border-white/[0.07]',
      className,
    )}>
      {children}
    </div>
  )
}

export function CardHeader({
  title, action, sub,
}: { title: string; action?: ReactNode; sub?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-sm font-medium text-white">{title}</h2>
        {sub && <p className="text-xs text-white/35 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}


// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'accent' | 'gray'

export function Badge({
  children, variant = 'gray',
}: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={clsx(
      'inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full',
      {
        green:  'bg-green-500/10 text-green-400',
        amber:  'bg-amber-400/10 text-amber-400',
        red:    'bg-red-500/10 text-red-400',
        blue:   'bg-blue-500/10 text-blue-400',
        accent: 'bg-accent/10 text-accent',
        gray:   'bg-white/5 text-white/50',
      }[variant],
    )}>
      {children}
    </span>
  )
}


// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({
  value, label, className,
}: { value: number; label?: string; className?: string }) {
  const color = value === 100 ? 'bg-green-400' : 'bg-accent'
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-1 bg-bg-4 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}


// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon, title, description, action,
}: {
  icon:        ReactNode
  title:       string
  description: string
  action?:     ReactNode
}) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-3 opacity-20">{icon}</div>
      <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
      <p className="text-xs text-white/30 max-w-xs mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}


// ── SEO score ring ────────────────────────────────────────────────────────────

export function ScoreRing({
  score, size = 56,
}: { score: number; size?: number }) {
  const r    = size * 0.39
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color  = score >= 80 ? '#4caf7d' : score >= 60 ? '#c8a96e' : '#e05252'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
           style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
                fill="none" stroke="#26282d" strokeWidth={size * 0.09} />
        <circle cx={size/2} cy={size/2} r={r}
                fill="none" stroke={color} strokeWidth={size * 0.09}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"
           style={{ fontSize: size * 0.26, fontWeight: 500, color }}>
        {Math.round(score)}
      </div>
    </div>
  )
}


// ── Tag pill ──────────────────────────────────────────────────────────────────

export function TagPill({
  label, onRemove,
}: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent
                     border border-accent/20 px-2.5 py-1 rounded-full">
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-accent/50 hover:text-accent ml-0.5 transition-colors"
        >
          ×
        </button>
      )}
    </span>
  )
}


// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-accent" />
}


// ── Stat card ─────────────────────────────────────────────────────────────────

export function StatCard({
  label, value, delta, deltaUp,
}: { label: string; value: string | number; delta?: string; deltaUp?: boolean }) {
  return (
    <div className="bg-bg-2 border border-white/[0.07] rounded-xl p-5">
      <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-serif font-light text-white">{value}</p>
      {delta && (
        <p className={clsx('text-xs mt-1', deltaUp ? 'text-green-400' : 'text-white/35')}>
          {deltaUp ? '↑' : ''} {delta}
        </p>
      )}
    </div>
  )
}
