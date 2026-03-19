import { Store } from 'lucide-react'

export default function ShopPage() {
  return (
    <div className="max-w-xl space-y-4">
      <div className="card border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Store size={16} className="text-blue-400 shrink-0" />
          <span>Connect your Etsy API key in Settings to see live shop analytics.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Views (30d)',       value: '—' },
          { label: 'Conversion rate',   value: '—' },
          { label: 'Orders',            value: '—' },
          { label: 'Revenue (USD)',      value: '—' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-2xl font-serif text-white/30">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
