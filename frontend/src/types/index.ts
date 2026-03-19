export interface UploadResponse {
  template_id: string
  filename:    string
  size:        number
}

export interface BatchResponse {
  job_id: string
  status: string
  total:  number
}

export interface JobStatus {
  job_id:        string
  status:        'queued' | 'running' | 'complete' | 'failed' | 'cancelled'
  progress:      number
  message?:      string
  download_url?: string
  error?:        string
  manifest?: {
    files: string[]
    count: number
    zip:   string
  }
}

export interface Listing {
  id?:              string
  template_id?:     string
  theme_id?:        string
  product_type:     'cv' | 'planner' | 'cover_letter'
  title:            string
  description:      string
  tags:             string[]
  price:            number
  seo_score?:       number
  etsy_listing_id?: string
  published:        boolean
  thumbnail_url?:   string
  created_at?:      string
}

export interface ListingGenResult {
  title:            string
  description:      string
  tags:             string[]
  price_suggestion: number
  seo_notes:        string
}

export interface SEOScore {
  total:             number
  title_score:       number
  tags_score:        number
  description_score: number
  conversion_score:  number
  issues:            string[]
  improvements:      string[]
}

export interface KeywordResult {
  keyword:               string
  search_volume:         'low' | 'medium' | 'high'
  competition:           number
  trend:                 'rising' | 'stable' | 'declining'
  long_tail_suggestions: string[]
  recommendation:        string
}

export interface EtsyStatus {
  connected:   boolean
  has_token:   boolean
  api_key_set: boolean
  reason?:     string
}

export interface ThumbnailResult {
  path: string
  url:  string
}

export type ThemeId       = string
export type FontName      = string
export type PageFormat    = 'A4' | 'USLetter'
export type Layout        = 'weekly' | 'monthly' | 'daily' | 'habit' | 'budget' | 'notes'
export type ProductType   = 'cv' | 'planner' | 'cover_letter'
export type ThumbnailStyle = 'single' | 'grid' | 'mockup'
