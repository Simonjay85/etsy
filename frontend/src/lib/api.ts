import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/v1`,
  timeout: 30_000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

// ── Templates ────────────────────────────────────────────────────────────────
export const templatesApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<{ template_id: string; filename: string; size: number }>(
      '/generate/upload', fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
  list: () => api.get('/templates/'),
  delete: (id: string) => api.delete(`/templates/${id}`),
}

// ── Generate ─────────────────────────────────────────────────────────────────
export const generateApi = {
  batch: (payload: {
    template_id: string
    themes: string[]
    fonts: string[]
    pages: string[]
    product_type?: string
  }) => api.post<{ job_id: string; status: string; total: number }>('/generate/batch', payload),

  downloadZip: (jobId: string) =>
    `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/v1/generate/download/${jobId}/zip`,
}

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const jobsApi = {
  status: (jobId: string) =>
    api.get<{
      job_id: string
      status: string
      progress: number
      message?: string
      download_url?: string
      manifest?: { files: string[]; count: number }
    }>(`/jobs/${jobId}`),
  cancel: (jobId: string) => api.delete(`/jobs/${jobId}`),
}

// ── Image ────────────────────────────────────────────────────────────────────
export const imageApi = {
  renderPng: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/image/render-png', fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  thumbnail: (payload: {
    job_id: string
    preview_pngs: string[]
    title: string
    style?: 'single' | 'grid' | 'mockup'
  }) => api.post<{ path: string; url: string }>('/image/thumbnail', payload),
}

// ── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  generateListing: (payload: {
    template_name: string
    theme_color: string
    product_type?: string
    target_industry?: string
    language?: string
  }) => api.post<{
    title: string
    description: string
    tags: string[]
    price_suggestion: number
    seo_notes: string
  }>('/ai/generate-listing', payload),

  analyzeKeyword: (keyword: string, niche?: string) =>
    api.post('/ai/analyze-keyword', { keyword, niche }),

  scoreListing: (payload: { title: string; tags: string[]; description: string }) =>
    api.post('/ai/seo-score', payload),
}
