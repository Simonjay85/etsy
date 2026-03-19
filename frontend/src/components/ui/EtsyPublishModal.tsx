/**
 * EtsyPublishModal
 * Shows listing preview, lets user review title/tags/desc,
 * then publishes to Etsy via API.
 */
import { useState } from 'react'
import { ExternalLink, Send, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Button, TagPill, ScoreRing } from '@/components/ui'
import type { ListingGenResult } from '@/types'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props {
  listing:       ListingGenResult
  shopId:        string
  docxPath?:     string
  thumbnailPath?: string
  onClose:       () => void
  onPublished:   (etsyId: string) => void
}

export default function EtsyPublishModal({
  listing, shopId, docxPath, thumbnailPath, onClose, onPublished,
}: Props) {
  const [title,       setTitle]       = useState(listing.title)
  const [description, setDescription] = useState(listing.description)
  const [tags,        setTags]        = useState<string[]>(listing.tags)
  const [price,       setPrice]       = useState(listing.price_suggestion)
  const [activate,    setActivate]    = useState(false)
  const [publishing,  setPublishing]  = useState(false)
  const [newTag,      setNewTag]      = useState('')

  // Simple local SEO score
  const score = Math.min(100, Math.round(
    (title.length >= 80 ? 25 : title.length / 80 * 25) +
    (tags.length === 13 ? 25 : tags.length / 13 * 25) +
    (description.length >= 400 ? 25 : description.length / 400 * 25) + 20
  ))

  const publish = async () => {
    if (!shopId) { toast.error('Shop ID required — check Settings'); return }
    setPublishing(true)
    try {
      const { data } = await axios.post(`${API}/api/v1/etsy/publish`, {
        shop_id:        shopId,
        title,
        description,
        tags,
        price,
        docx_path:      docxPath      ?? '',
        thumbnail_path: thumbnailPath ?? '',
        activate,
      })
      toast.success(activate ? 'Listing published live!' : 'Draft created on Etsy!')
      onPublished(data.etsy_listing_id)
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? e.message
      toast.error(`Publish failed: ${msg}`)
    } finally {
      setPublishing(false)
    }
  }

  const addTag = () => {
    const v = newTag.trim().toLowerCase()
    if (!v || tags.includes(v) || tags.length >= 13 || v.length > 20) return
    setTags([...tags, v])
    setNewTag('')
  }

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-bg-2 border border-white/[0.12] rounded-2xl w-full max-w-2xl
                      max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div>
            <h2 className="text-sm font-medium">Publish to Etsy</h2>
            <p className="text-xs text-white/35 mt-0.5">Review and publish listing</p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing score={score} size={44} />
            <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">Title</label>
              <span className={clsx('text-xs', title.length > 140 ? 'text-red-400' : title.length >= 80 ? 'text-green-400' : 'text-amber-400')}>
                {title.length}/140
              </span>
            </div>
            <textarea
              value={title} rows={2}
              onChange={e => setTitle(e.target.value)}
              className="input resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40 uppercase tracking-widest">Tags</label>
              <span className={clsx('text-xs', tags.length === 13 ? 'text-green-400' : 'text-amber-400')}>
                {tags.length}/13
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t, i) => (
                <TagPill key={t} label={t} onRemove={() => setTags(tags.filter((_,j) => j !== i))} />
              ))}
            </div>
            {tags.length < 13 && (
              <div className="flex gap-2">
                <input value={newTag} onChange={e => setNewTag(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && addTag()}
                       placeholder="Add tag (Enter)…"
                       className="input flex-1 text-xs py-1.5" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">
              Description
            </label>
            <textarea value={description} rows={6}
                      onChange={e => setDescription(e.target.value)}
                      className="input resize-none text-xs leading-relaxed" />
          </div>

          {/* Price + activate toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Price (USD)</label>
              <input type="number" min={0.99} step={0.50}
                     value={price} onChange={e => setPrice(Number(e.target.value))}
                     className="input w-32" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={activate}
                       onChange={e => setActivate(e.target.checked)}
                       className="sr-only peer" />
                <div className="w-9 h-5 bg-bg-4 peer-checked:bg-accent rounded-full relative
                                after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                after:w-4 after:h-4 after:bg-white after:rounded-full
                                after:transition-transform peer-checked:after:translate-x-4" />
              </label>
              <span className="text-sm text-white/60">
                {activate ? 'Publish live' : 'Save as draft'}
              </span>
            </div>
          </div>

          {!activate && (
            <div className="flex items-start gap-2 p-3 bg-amber-400/5 border border-amber-400/15 rounded-lg">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400/80">
                Listing will be created as a draft. You can review and activate it from your Etsy dashboard.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="primary" className="flex-1" loading={publishing}
                    icon={<Send size={13} />} onClick={publish}>
              {activate ? 'Publish live' : 'Create draft'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
