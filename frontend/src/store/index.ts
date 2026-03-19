import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Listing } from '@/types'

// ── Settings ──────────────────────────────────────────────────────────────────
interface SettingsState {
  anthropicKey: string
  etsyToken:    string
  etsyShopId:   string
  setAnthropicKey: (k: string) => void
  setEtsyToken:    (t: string) => void
  setEtsyShopId:   (id: string) => void
}

export const useSettings = create<SettingsState>()(persist(
  (set) => ({
    anthropicKey: '',
    etsyToken:    '',
    etsyShopId:   '',
    setAnthropicKey: (k)  => set({ anthropicKey: k }),
    setEtsyToken:    (t)  => set({ etsyToken: t }),
    setEtsyShopId:   (id) => set({ etsyShopId: id }),
  }),
  { name: 'cvstudio-settings' }
))

// ── Jobs ──────────────────────────────────────────────────────────────────────
interface Job {
  id: string; status: string; progress: number
  message: string; createdAt: number; files?: string[]
}
interface JobsState {
  jobs: Record<string, Job>; activeJob: string | null
  addJob:    (id: string) => void
  updateJob: (id: string, patch: Partial<Job>) => void
  setActive: (id: string | null) => void
  clearDone: () => void
}

export const useJobs = create<JobsState>((set) => ({
  jobs: {}, activeJob: null,
  addJob: (id) => set((s) => ({
    jobs: { ...s.jobs, [id]: { id, status:'queued', progress:0, message:'', createdAt:Date.now() } },
    activeJob: id,
  })),
  updateJob: (id, patch) => set((s) => ({ jobs: { ...s.jobs, [id]: { ...s.jobs[id], ...patch } } })),
  setActive: (id) => set({ activeJob: id }),
  clearDone: () => set((s) => ({
    jobs: Object.fromEntries(Object.entries(s.jobs).filter(([,j])=>j.status!=='complete'&&j.status!=='failed'))
  })),
}))

// ── Listings cache ────────────────────────────────────────────────────────────
interface ListingsState {
  listings: Listing[]
  addListing:    (l: Listing) => void
  updateListing: (id: string, patch: Partial<Listing>) => void
  removeListing: (id: string) => void
}

export const useListings = create<ListingsState>()(persist(
  (set) => ({
    listings: [],
    addListing:    (l)  => set((s) => ({ listings: [l, ...s.listings] })),
    updateListing: (id, patch) => set((s) => ({
      listings: s.listings.map(l => l.id === id ? { ...l, ...patch } : l)
    })),
    removeListing: (id) => set((s) => ({ listings: s.listings.filter(l => l.id !== id) })),
  }),
  { name: 'cvstudio-listings' }
))

// ── Upload history ────────────────────────────────────────────────────────────
interface UploadedTemplate { id: string; filename: string; uploadedAt: number }
interface UploadHistoryState {
  templates: UploadedTemplate[]
  addTemplate: (t: UploadedTemplate) => void
  remove:      (id: string) => void
}

export const useUploadHistory = create<UploadHistoryState>()(persist(
  (set) => ({
    templates:   [],
    addTemplate: (t)  => set((s) => ({ templates: [t, ...s.templates].slice(0, 20) })),
    remove:      (id) => set((s) => ({ templates: s.templates.filter(t => t.id !== id) })),
  }),
  { name: 'cvstudio-uploads' }
))
