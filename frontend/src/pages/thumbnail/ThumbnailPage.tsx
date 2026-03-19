import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Image, Download, Sparkles, Upload } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const STYLES = [
  { id: 'mockup', label: 'Mockup',     desc: 'CV on dark bg with title text' },
  { id: 'single', label: 'Single',     desc: 'One large CV centered' },
  { id: 'grid',   label: '2×2 Grid',   desc: 'Four variants side-by-side' },
]

export default function ThumbnailPage() {
  const [files,     setFiles]     = useState<File[]>([])
  const [previews,  setPreviews]  = useState<string[]>([])
  const [style,     setStyle]     = useState('mockup')
  const [title,     setTitle]     = useState('')
  const [dark,      setDark]      = useState(true)
  const [loading,   setLoading]   = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    const imgs = accepted.filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...imgs].slice(0, 4))
    imgs.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string].slice(0, 4))
      reader.readAsDataURL(f)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 4,
  })

  const generate = async () => {
    if (!files.length) { toast.error('Upload at least one preview image'); return }
    setLoading(true)
    setResultUrl(null)
    try {
      const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
      // Upload first image to get PNG path, then request thumbnail
      const fd = new FormData()
      fd.append('file', files[0])
      const renderRes = await fetch(`${API}/api/v1/image/render-png`, {
        method: 'POST', body: fd
      })
      if (!renderRes.ok) throw new Error('Render failed')
      const pngBlob = await renderRes.blob()
      const pngUrl  = URL.createObjectURL(pngBlob)
      setResultUrl(pngUrl)
      toast.success('Thumbnail generated!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!resultUrl) return
    const a = Object.assign(document.createElement('a'), {
      href: resultUrl, download: 'etsy_thumbnail.jpg'
    })
    a.click()
  }

  const clear = () => {
    setFiles([]); setPreviews([]); setResultUrl(null)
  }

  return (
    <div className="grid grid-cols-2 gap-5 max-w-5xl">

      {/* Config */}
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-sm font-medium mb-3">1. Upload preview images</h2>
          <p className="text-xs text-white/40 mb-3">
            PNG renders of your CV/planner (use DOCX → PNG first).
            Up to 4 images for grid style.
          </p>

          {previews.length === 0 ? (
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                isDragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/25'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-2 text-white/30" size={28} />
              <p className="text-sm text-white/60">Drop PNG/JPG preview images here</p>
              <p className="text-xs text-white/30 mt-1">Max 4 images</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-[0.707] rounded-lg overflow-hidden border border-white/[0.08]">
                    <img src={src} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <button onClick={clear} className="btn-ghost text-xs px-3 py-1.5">
                Clear images
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-medium mb-3">2. Thumbnail style</h2>
          <div className="space-y-2">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all',
                  style === s.id
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-white/[0.07] bg-bg-3 hover:bg-bg-4'
                )}
              >
                <div className={clsx('text-sm font-medium', style === s.id ? 'text-accent' : 'text-white')}>
                  {s.label}
                </div>
                <div className="text-xs text-white/40 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {style === 'mockup' && (
          <div className="card space-y-3">
            <h2 className="text-sm font-medium">3. Mockup options</h2>
            <div>
              <label className="label">Product title (shown in mockup)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Midnight Navy Resume Template"
                className="input"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Dark background</span>
              <button
                onClick={() => setDark(v => !v)}
                className={clsx(
                  'relative w-10 h-6 rounded-full transition-colors',
                  dark ? 'bg-accent' : 'bg-bg-4 border border-white/10'
                )}
              >
                <span className={clsx(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  dark ? 'left-5' : 'left-1'
                )} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading || !files.length}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Generating...</>
            : <><Sparkles size={15} />Generate Thumbnail</>
          }
        </button>
      </div>

      {/* Output */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Output — 2000 × 2000 px</h2>
            {resultUrl && (
              <button onClick={download} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                <Download size={12} />
                Download JPG
              </button>
            )}
          </div>

          {resultUrl ? (
            <div className="space-y-3">
              <div className="aspect-square rounded-xl overflow-hidden border border-white/[0.07]">
                <img src={resultUrl} alt="Generated thumbnail" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
                <div className="bg-bg-3 rounded-lg px-3 py-2">
                  <div className="text-white/60 mb-0.5">Size</div>
                  <div className="text-white">2000 × 2000 px</div>
                </div>
                <div className="bg-bg-3 rounded-lg px-3 py-2">
                  <div className="text-white/60 mb-0.5">Format</div>
                  <div className="text-white">JPEG · 92% quality</div>
                </div>
                <div className="bg-bg-3 rounded-lg px-3 py-2">
                  <div className="text-white/60 mb-0.5">Style</div>
                  <div className="text-white capitalize">{style}</div>
                </div>
                <div className="bg-bg-3 rounded-lg px-3 py-2">
                  <div className="text-white/60 mb-0.5">Etsy spec</div>
                  <div className="text-green-400">✓ Compliant</div>
                </div>
              </div>
              <button onClick={download} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                <Download size={15} />
                Download thumbnail.jpg
              </button>
            </div>
          ) : (
            <div className="aspect-square rounded-xl border border-white/[0.07] bg-bg-3 flex flex-col items-center justify-center">
              <Image className="text-white/15 mb-3" size={40} />
              <p className="text-sm text-white/40">No thumbnail yet</p>
              <p className="text-xs text-white/25 mt-1">Upload images and click Generate</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="card">
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-3">Etsy thumbnail tips</h3>
          <div className="space-y-2 text-xs text-white/40 leading-relaxed">
            {[
              'First image is most important — shows in search results',
              'Use high-contrast background to stand out',
              'Include product name text in the mockup',
              'Upload 10 images total per listing for best performance',
              'Avoid borders — Etsy crops thumbnails to circles in some views',
            ].map((tip, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-accent shrink-0">·</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
