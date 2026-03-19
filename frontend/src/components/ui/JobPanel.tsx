/**
 * JobPanel — reusable job progress + file list + download
 * Used by UploadPage and ThumbnailPage
 */
import { FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { ProgressBar, Button, EmptyState } from '@/components/ui'
import { useJobPoller } from '@/hooks/useJobPoller'
import { generateApi } from '@/lib/api'

interface Props {
  jobId:       string | null
  onReset?:    () => void
  emptyTitle?: string
  emptyDesc?:  string
}

export default function JobPanel({
  jobId, onReset,
  emptyTitle = 'No files yet',
  emptyDesc  = 'Configure options and start generation',
}: Props) {
  const { data: job } = useJobPoller(jobId)

  const isComplete = job?.status === 'complete'
  const isFailed   = job?.status === 'failed'
  const isRunning  = job?.status === 'running' || job?.status === 'queued'

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (!jobId) {
    return (
      <EmptyState
        icon="◧"
        title={emptyTitle}
        description={emptyDesc}
      />
    )
  }

  // ── Running ───────────────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <div className="space-y-4">
        <ProgressBar
          value={job?.progress ?? 0}
          label={job?.message ?? 'Processing…'}
        />
        <div className="py-10 text-center">
          <div className="inline-flex gap-1 mb-3">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-xs text-white/35">
            {job?.message ?? 'Generating…'}
          </p>
        </div>
      </div>
    )
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (isFailed) {
    return (
      <div className="py-10 text-center space-y-3">
        <AlertCircle className="mx-auto text-red-400" size={32} />
        <p className="text-sm font-medium text-red-400">Generation failed</p>
        <p className="text-xs text-white/35 max-w-xs mx-auto">{job?.error ?? 'Unknown error'}</p>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>Try again</Button>
        )}
      </div>
    )
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (isComplete && job?.manifest) {
    const files    = job.manifest.files ?? []
    const zipUrl   = generateApi.downloadZip(jobId!)

    return (
      <div className="space-y-3">
        {/* Summary bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={15} />
            <span>{files.length} files created</span>
          </div>
          <a href={zipUrl}
             className="inline-flex items-center gap-1.5 text-xs font-medium
                        bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">
            <Download size={12} />
            Download ZIP
          </a>
        </div>

        <ProgressBar value={100} />

        {/* File list */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {files.map((f: string) => (
            <FileRow key={f} filename={f} jobId={jobId!} />
          ))}
        </div>

        {/* Big download button */}
        <div className="pt-2 border-t border-white/[0.07]">
          <a href={zipUrl}
             className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                        bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors">
            <Download size={15} />
            Download all ({files.length} files)
          </a>
        </div>
      </div>
    )
  }

  return null
}


// ── File row ──────────────────────────────────────────────────────────────────

function FileRow({ filename, jobId }: { filename: string; jobId: string }) {
  const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

  // Parse theme + font + format from filename
  const parts = filename.replace('.docx','').split('_')
  const meta  = parts.slice(1).join(' · ')

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-3 rounded-lg border border-white/[0.06]">
      <FileText size={13} className="text-white/30 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{filename}</p>
        {meta && <p className="text-[10px] text-white/30 mt-0.5">{meta}</p>}
      </div>
      <a
        href={`${API}/api/v1/generate/download/${jobId}/${filename}`}
        download={filename}
        className="text-[11px] px-2.5 py-1 rounded-md bg-green-500/10 text-green-400
                   border border-green-500/20 hover:bg-green-500/20 transition-colors whitespace-nowrap"
      >
        ↓ Save
      </a>
    </div>
  )
}
