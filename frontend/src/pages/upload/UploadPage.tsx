import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Zap, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { THEMES, FONTS, PAGE_FORMATS } from '@/lib/constants'
import { templatesApi, generateApi } from '@/lib/api'
import { useJobPoller } from '@/hooks/useJobPoller'

export default function UploadPage() {
  const [file, setFile]             = useState<File | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [jobId, setJobId]           = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const [selThemes, setSelThemes]   = useState<Set<string>>(
    new Set(['midnight_navy', 'forest_green', 'burgundy', 'charcoal'])
  )
  const [selFonts, setSelFonts]     = useState<Set<string>>(new Set(['Calibri', 'Georgia']))
  const [selPages, setSelPages]     = useState<Set<string>>(new Set(['A4', 'USLetter']))

  const { data: job } = useJobPoller(jobId)
  const totalVariants = selThemes.size * selFonts.size * selPages.size

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setUploading(true)
    try {
      const { data } = await templatesApi.upload(f)
      setTemplateId(data.template_id)
      toast.success(`Uploaded: ${f.name}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  })

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!templateId) return
    if (!selThemes.size || !selFonts.size || !selPages.size) {
      toast.error('Select at least one theme, font and format')
      return
    }
    setGenerating(true)
    try {
      const { data } = await generateApi.batch({
        template_id: templateId,
        themes: [...selThemes],
        fonts: [...selFonts],
        pages: [...selPages],
      })
      setJobId(data.job_id)
      toast.success(`Job started — creating ${data.total} variants`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const toggle = (set: Set<string>, val: string): Set<string> => {
    const s = new Set(set)
    s.has(val) ? s.delete(val) : s.add(val)
    return s
  }

  const isComplete = job?.status === 'complete'
  const isFailed   = job?.status === 'failed'

  return (
    <div className="grid grid-cols-2 gap-5 max-w-6xl">

      {/* ── Left: Config ─────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Upload zone */}
        <div className="card">
          <h2 className="text-sm font-medium mb-4">1. Upload template</h2>
          {!file ? (
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-accent bg-accent/5'
                  : 'border-white/10 hover:border-white/25'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-3 text-white/30" size={32} />
              <p className="text-sm text-white font-medium mb-1">
                {isDragActive ? 'Drop it here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-white/35">Supports .docx — CV, planner, any template</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-bg-3 rounded-lg p-3 border border-white/[0.07]">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {uploading ? 'Uploading...' : templateId ? '✓ Ready' : `${(file.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
              <button
                onClick={() => { setFile(null); setTemplateId(null) }}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Themes */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">2. Colors
              <span className="text-white/35 text-xs ml-2">({selThemes.size} selected)</span>
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setSelThemes(new Set(THEMES.map(t => t.id)))} className="text-xs text-white/40 hover:text-white/70">All</button>
              <button onClick={() => setSelThemes(new Set())} className="text-xs text-white/40 hover:text-white/70">None</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelThemes(prev => toggle(prev, t.id))}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all',
                  selThemes.has(t.id)
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-white/10 text-white/45 hover:bg-bg-4'
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="card">
          <h2 className="text-sm font-medium mb-3">3. Fonts
            <span className="text-white/35 text-xs ml-2">({selFonts.size} selected)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {FONTS.map(f => (
              <button
                key={f}
                onClick={() => setSelFonts(prev => toggle(prev, f))}
                className={clsx(
                  'px-3 py-1.5 rounded-full border text-xs transition-all',
                  selFonts.has(f)
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-white/10 text-white/45 hover:bg-bg-4'
                )}
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Page format */}
        <div className="card">
          <h2 className="text-sm font-medium mb-3">4. Page format</h2>
          <div className="flex gap-2">
            {PAGE_FORMATS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelPages(prev => toggle(prev, p.id))}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg border text-sm transition-all',
                  selPages.has(p.id)
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-white/10 text-white/45 hover:bg-bg-4'
                )}
              >
                <div className="font-medium">{p.label}</div>
                <div className="text-xs opacity-60 mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary + Generate CTA */}
        <div className="card border-accent/20 bg-accent/5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-serif text-accent">{totalVariants}</span>
            <span className="text-sm text-white/60">files will be created</span>
          </div>
          <p className="text-xs text-white/35 mb-4">
            {selThemes.size} colors × {selFonts.size} fonts × {selPages.size} formats
            · ~{Math.ceil(totalVariants * 2)}s
          </p>
          <button
            onClick={handleGenerate}
            disabled={!templateId || generating || !!jobId && !isComplete && !isFailed}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            {generating ? 'Starting...' : 'Generate all variants'}
          </button>
        </div>
      </div>

      {/* ── Right: Output ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Output</h2>
            {isComplete && (
              <a
                href={generateApi.downloadZip(jobId!)}
                className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
              >
                <Download size={12} />
                Download ZIP
              </a>
            )}
          </div>

          {/* Idle */}
          {!jobId && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-20">◧</div>
              <p className="text-sm font-medium text-white/60 mb-1">No files yet</p>
              <p className="text-xs text-white/30">Upload a template and configure options to start</p>
            </div>
          )}

          {/* Progress */}
          {jobId && !isComplete && !isFailed && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>{job?.message ?? 'Processing...'}</span>
                  <span>{job?.progress ?? 0}%</span>
                </div>
                <div className="h-1 bg-bg-4 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${job?.progress ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="py-8 text-center">
                <div className="inline-flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-3">Generating variants...</p>
              </div>
            </div>
          )}

          {/* Complete */}
          {isComplete && job?.manifest && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
                <CheckCircle size={16} />
                <span>{job.manifest.count} files created</span>
              </div>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {job.manifest.files?.map((f: string) => (
                  <div key={f} className="flex items-center gap-2 text-xs bg-bg-3 rounded-lg px-3 py-2">
                    <FileText size={12} className="text-white/40 shrink-0" />
                    <span className="text-white/70 truncate flex-1">{f}</span>
                    <CheckCircle size={11} className="text-green-400 shrink-0" />
                  </div>
                ))}
              </div>
              <a
                href={generateApi.downloadZip(jobId!)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                <Download size={15} />
                Download all as ZIP
              </a>
            </div>
          )}

          {/* Failed */}
          {isFailed && (
            <div className="py-10 text-center">
              <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
              <p className="text-sm text-red-400 font-medium mb-1">Generation failed</p>
              <p className="text-xs text-white/35">{job?.manifest as any}</p>
              <button onClick={() => setJobId(null)} className="btn-ghost mt-4 text-xs px-4 py-2">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
