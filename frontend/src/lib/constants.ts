export const THEMES = [
  { id: 'teal_original',  name: 'Teal',           color: '#5C94A3' },
  { id: 'midnight_navy',  name: 'Midnight Navy',   color: '#3A6186' },
  { id: 'forest_green',   name: 'Forest Green',    color: '#2E7D52' },
  { id: 'burgundy',       name: 'Burgundy',        color: '#8B2635' },
  { id: 'deep_purple',    name: 'Deep Purple',     color: '#5B3A8C' },
  { id: 'charcoal',       name: 'Charcoal',        color: '#546E7A' },
  { id: 'terracotta',     name: 'Terracotta',      color: '#A0522D' },
  { id: 'slate_blue',     name: 'Slate Blue',      color: '#4A6FA5' },
  { id: 'rose_gold',      name: 'Rose Gold',       color: '#B5656A' },
  { id: 'ocean',          name: 'Ocean',           color: '#1E7A8C' },
  { id: 'olive_green',    name: 'Olive Green',     color: '#5C6B2A' },
  { id: 'warm_brown',     name: 'Warm Brown',      color: '#7B5C3A' },
] as const

export const FONTS = [
  'Calibri',
  'Georgia',
  'Garamond',
  'Century Gothic',
  'Trebuchet MS',
  'Palatino Linotype',
  'Book Antiqua',
  'Cambria',
] as const

export const PAGE_FORMATS = [
  { id: 'A4',       label: 'A4',        sub: '210 × 297 mm' },
  { id: 'USLetter', label: 'US Letter', sub: '8.5 × 11 in'  },
] as const

export type ThemeId     = typeof THEMES[number]['id']
export type FontName    = typeof FONTS[number]
export type PageFormat  = typeof PAGE_FORMATS[number]['id']
