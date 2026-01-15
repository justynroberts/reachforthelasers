// Shared types between client and server

export interface Note {
  step: number       // 0-255 (16 bars × 16 steps)
  pitch: number      // Scale degree index (0 = root in lowest octave)
  velocity: number   // 0-127
  length: number     // In steps (1 = 1/16, 2 = 1/8, 4 = 1/4)
  accent: boolean
}

export interface Pattern {
  notes: Note[]
  scale: ScaleType
  rootNote: number   // MIDI note number (60 = middle C)
  tempo: number      // BPM
}

export interface CatalogPattern extends Pattern {
  id: string
  name: string
  description: string
  tags: Tag[]
  createdAt: string
  loadCount: number
}

export type ScaleType =
  | 'major'
  | 'minor'
  | 'harmonicMinor'
  | 'melodicMinor'
  | 'dorian'
  | 'phrygian'
  | 'phrygianDominant'
  | 'lydian'
  | 'mixolydian'
  | 'wholeTone'
  | 'diminished'
  | 'pentatonicMajor'
  | 'pentatonicMinor'
  | 'blues'

export const SCALE_TYPES: ScaleType[] = [
  'major',
  'minor',
  'harmonicMinor',
  'melodicMinor',
  'dorian',
  'phrygian',
  'phrygianDominant',
  'lydian',
  'mixolydian',
  'wholeTone',
  'diminished',
  'pentatonicMajor',
  'pentatonicMinor',
  'blues'
]

export const TAGS = [
  'Uplifting',
  'Progressive',
  'Psytrance',
  'Tech-Trance',
  'Goa',
  'Lead',
  'Bass',
  'Arp',
  'Pad-Rhythm',
  'FX',
  'Simple',
  'Complex',
  'Rolling',
  'Sparse',
  'Melodic'
] as const

export type Tag = typeof TAGS[number]

// Constants
export const STEPS_PER_BAR = 16
export const TOTAL_BARS = 16
export const TOTAL_STEPS = STEPS_PER_BAR * TOTAL_BARS // 256

export const MIN_TEMPO = 120
export const MAX_TEMPO = 160
export const DEFAULT_TEMPO = 138

export const DEFAULT_VELOCITY = 100
export const DEFAULT_NOTE_LENGTH = 1

// API types
export interface CreatePatternRequest {
  description: string
  name?: string
  notes: Note[]
  scale: ScaleType
  rootNote: number
  tempo: number
  tags?: Tag[]
}

export interface GetPatternsQuery {
  search?: string
  sort?: 'newest' | 'mostLoaded' | 'random'
  tags?: string
  limit?: number
  offset?: number
}

export interface GetPatternsResponse {
  patterns: CatalogPattern[]
}
