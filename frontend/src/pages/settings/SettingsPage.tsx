import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useSettings } from '@/store'
import { useServerStatus } from '@/hooks/useServerStatus'

export default function SettingsPage() {
  const { anthropicKey, etsyToken, etsyShopId,
          setAnthropicKey, setEtsyToken, setEtsyShopId } = useSettings()
  const { connected } = useServerStatus()

  const [showAnt,  setShowAnt]  = useState(false)
  const [showEtsy, setShowEtsy] = useState(false)
  const [testing,  setTesting]  = useState(false)

  const testClaude = async () => {
    if (!anthropicKey) { toast.error('Enter API key first'); return }
    setTesting(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'x-api-key':          anthropicKey,
          'anthropic-version':  '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages:   [{ role: 'user', content: 'Say OK' }],
        }),
      })
      if (res.ok) toast.success('Claude API connected!')
      else        toast.error('Invalid API key')
    } catch {
      toast.error('Connection failed')
    } finally {
      setTesting(false)
    }
  }

  const connectEtsy = () => {
    const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    window.open(`${API}/api/v1/etsy/auth`, '_blank')
  }

  return (
    <div className="max-w-2xl space-y-5">

      {/* Server status */}
      <div className={clsx(
        'rounded-xl border px-5 py-4 flex items-center gap-3 text-sm',
        connected
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5'
      )}>
        {connected
          ? <CheckCircle size={16} className="text-green-400 shrink-0" />
          : <XCircle    size={16} className="text-red-400  shrink-0" />}
        <div>
          <span className={connected ? 'text-green-300' : 'text-red-300'}>
            {connected ? 'Backend server running' : 'Backend server offline'}
          </span>
          <p className="text-white/40 text-xs mt-0.5">
            {connected
              ? 'API at http://localhost:8000 · All features available'
              : 'Run: cd backend && uvicorn app.main:app --reload'}
          </p>
        </div>
      </div>

      {/* Anthropic */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-sm font-medium">Anthropic API Key</h2>
          <p className="text-xs text-white/40 mt-1">
            Powers AI listing generation, keyword analysis, SEO scoring.
            Get yours at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
               className="text-accent hover:underline inline-flex items-center gap-0.5">
              console.anthropic.com <ExternalLink size={10} />
            </a>
          </p>
        </div>
        <div className="relative">
          <input
            type={showAnt ? 'text' : 'password'}
            value={anthropicKey}
            onChange={e => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="input pr-10"
          />
          <button
            onClick={() => setShowAnt(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            {showAnt ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={testClaude} disabled={testing} className="btn-primary text-xs px-4 py-2">
            {testing ? 'Testing...' : 'Test connection'}
          </button>
          {anthropicKey && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle size={12} /> Key saved
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/25">
          Key stored in your browser only — never sent to our servers.
        </p>
      </div>

      {/* Etsy */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-sm font-medium">Etsy Shop</h2>
          <p className="text-xs text-white/40 mt-1">
            Connect to sync listings, view analytics, and auto-publish products.
          </p>
        </div>
        <div className="space-y-2">
          <div>
            <label className="label">Access Token (after OAuth)</label>
            <div className="relative">
              <input
                type={showEtsy ? 'text' : 'password'}
                value={etsyToken}
                onChange={e => setEtsyToken(e.target.value)}
                placeholder="Paste token after connecting..."
                className="input pr-10"
              />
              <button
                onClick={() => setShowEtsy(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showEtsy ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Shop ID / Username</label>
            <input
              value={etsyShopId}
              onChange={e => setEtsyShopId(e.target.value)}
              placeholder="e.g. MyShopName"
              className="input"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={connectEtsy} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
            <ExternalLink size={13} />
            Connect via OAuth
          </button>
          <a
            href="https://www.etsy.com/developers/register"
            target="_blank" rel="noreferrer"
            className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1"
          >
            Get API key <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            title: 'Monthly cost estimate',
            items: [
              { label: 'Netlify (frontend)', value: 'Free' },
              { label: 'Railway (backend)',  value: '~$5/mo' },
              { label: 'Cloudflare R2',      value: 'Free tier' },
              { label: 'Claude API',         value: '~$0.01/listing' },
            ],
          },
          {
            title: 'Stack versions',
            items: [
              { label: 'React',   value: '18.3' },
              { label: 'FastAPI', value: '0.111' },
              { label: 'Python',  value: '3.11' },
              { label: 'Claude',  value: 'Sonnet 4.5' },
            ],
          },
        ].map(card => (
          <div key={card.title} className="card">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-widest mb-3">
              {card.title}
            </h3>
            <div className="space-y-2">
              {card.items.map(item => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-white/40">{item.label}</span>
                  <span className="text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
