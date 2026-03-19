/**
 * Centralised React Query hooks
 * All data fetching in one place — import from here, not from lib/api.ts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  templatesApi, generateApi, imageApi, aiApi,
} from '@/lib/api'
import type {
  UploadResponse, BatchResponse, ListingGenResult,
  SEOScore, KeywordResult, ThumbnailResult,
} from '@/types'


// ── Server health ─────────────────────────────────────────────────────────────
export { useServerStatus } from './useServerStatus'

// ── Job poller ────────────────────────────────────────────────────────────────
export { useJobPoller } from './useJobPoller'


// ── Templates ─────────────────────────────────────────────────────────────────

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then(r => r.data),
  })
}

export function useUploadTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => templatesApi.upload(file).then(r => r.data as UploadResponse),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}


// ── Generate ──────────────────────────────────────────────────────────────────

export function useStartBatch() {
  return useMutation({
    mutationFn: (payload: {
      template_id: string
      themes:      string[]
      fonts:       string[]
      pages:       string[]
      product_type?: string
    }) => generateApi.batch(payload).then(r => r.data as BatchResponse),
    onSuccess: (data) => toast.success(`Job started — ${data.total} variants`),
    onError:   (e: Error) => toast.error(e.message),
  })
}


// ── Image ─────────────────────────────────────────────────────────────────────

export function useRenderPng() {
  return useMutation({
    mutationFn: (file: File) => imageApi.renderPng(file).then(r => r.data as Blob),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useGenerateThumbnail() {
  return useMutation({
    mutationFn: (payload: {
      job_id:       string
      preview_pngs: string[]
      title:        string
      style?:       'single' | 'grid' | 'mockup'
    }) => imageApi.thumbnail(payload).then(r => r.data as ThumbnailResult),
    onSuccess: () => toast.success('Thumbnail generated!'),
    onError:   (e: Error) => toast.error(e.message),
  })
}


// ── AI ────────────────────────────────────────────────────────────────────────

export function useGenerateListing() {
  return useMutation({
    mutationFn: (payload: {
      template_name:    string
      theme_color:      string
      product_type?:    string
      target_industry?: string
      language?:        string
    }) => aiApi.generateListing(payload).then(r => r.data as ListingGenResult),
    onSuccess: () => toast.success('Listing generated!'),
    onError:   (e: Error) => toast.error(e.message),
  })
}

export function useAnalyzeKeyword() {
  return useMutation({
    mutationFn: ({ keyword, niche }: { keyword: string; niche?: string }) =>
      aiApi.analyzeKeyword(keyword, niche).then(r => r.data as KeywordResult),
    onSuccess: () => toast.success('Keyword analyzed!'),
    onError:   (e: Error) => toast.error(e.message),
  })
}

export function useSEOScore() {
  return useMutation({
    mutationFn: (payload: { title: string; tags: string[]; description: string }) =>
      aiApi.scoreListing(payload).then(r => r.data as SEOScore),
    onError: (e: Error) => toast.error(e.message),
  })
}
