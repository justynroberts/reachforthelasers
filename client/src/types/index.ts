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
  tags: string[]
  createdAt: string
  loadCount: number
}

export type ScaleType =
  | 'chromatic'
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

export interface Scale {
  name: string
  intervals: number[]  // Semitones from root
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export type NoteName = typeof NOTE_NAMES[number]

export const TAGS = [
  'User',
  'Uplifting', 'Progressive', 'Psytrance', 'Tech-Trance', 'Goa',
  'Lead', 'Bass', 'Arp', 'Pad-Rhythm', 'FX',
  'Simple', 'Complex', 'Rolling', 'Sparse', 'Melodic'
] as const
export type Tag = typeof TAGS[number]

export const STEPS_PER_BAR = 16
export const TOTAL_BARS = 16
export const TOTAL_STEPS = STEPS_PER_BAR * TOTAL_BARS  // 256

export const DEFAULT_VELOCITY = 100
export const DEFAULT_NOTE_LENGTH = 1
export const DEFAULT_TEMPO = 138
export const MIN_TEMPO = 120
export const MAX_TEMPO = 160

export const OCTAVE_RANGE = 4  // Number of octaves to display (A2-A5)
export const MIN_ROOT_OCTAVE = 1  // Lowest octave for root note selection
export const MAX_ROOT_OCTAVE = 5  // Highest octave for root note selection

// Chord types for progression markers
export type ChordQuality = 'maj' | 'min' | '7' | 'maj7' | 'min7' | '9' | 'maj9' | 'min9' | '11' | 'min11' | 'dim' | 'aug' | 'sus2' | 'sus4'

export interface ChordMarker {
  step: number         // Position in the pattern (0-255)
  root: number         // Root note as semitone offset from C (0-11)
  quality: ChordQuality
  duration: number     // Duration in steps (16 = 1 bar, 32 = 2 bars, etc.)
}

export const CHORD_DURATIONS = [
  { value: 4, label: '1/4' },
  { value: 8, label: '1/2' },
  { value: 16, label: '1 bar' },
  { value: 32, label: '2 bars' },
  { value: 64, label: '4 bars' },
  { value: 128, label: '8 bars' },
  { value: 256, label: '16 bars' },
] as const

export const MIN_CHORD_DURATION = 4 // Quarter bar minimum

// Synth sound types
export type SynthType =
  | 'acidDark' | 'acidDarkDeep' | 'acidDarkGritty' | 'acidDarkHollow' | 'acidDarkSub'

export const SYNTH_TYPES: { value: SynthType; label: string }[] = [
  { value: 'acidDark', label: 'Acid Dark' },
  { value: 'acidDarkDeep', label: 'Acid Dark Deep' },
  { value: 'acidDarkGritty', label: 'Acid Dark Gritty' },
  { value: 'acidDarkHollow', label: 'Acid Dark Hollow' },
  { value: 'acidDarkSub', label: 'Acid Dark Sub' },
]

// Filter types
export type FilterType = 'lowpass' | 'highpass' | 'bandpass'

export const FILTER_TYPES: { value: FilterType; label: string }[] = [
  { value: 'lowpass', label: 'Low Pass' },
  { value: 'highpass', label: 'High Pass' },
  { value: 'bandpass', label: 'Band Pass' },
]

// Delay sync options (note values)
export type DelayTime = '16n' | '8n' | '8n.' | '4n' | '4n.' | '2n'

export const DELAY_TIMES: { value: DelayTime; label: string }[] = [
  { value: '16n', label: '1/16' },
  { value: '8n', label: '1/8' },
  { value: '8n.', label: '1/8 dot' },
  { value: '4n', label: '1/4' },
  { value: '4n.', label: '1/4 dot' },
  { value: '2n', label: '1/2' },
]

export const CHORD_QUALITIES: { value: ChordQuality; label: string; intervals: number[] }[] = [
  { value: 'maj', label: 'Major', intervals: [0, 4, 7] },
  { value: 'min', label: 'Minor', intervals: [0, 3, 7] },
  { value: '7', label: '7', intervals: [0, 4, 7, 10] },
  { value: 'maj7', label: 'Maj7', intervals: [0, 4, 7, 11] },
  { value: 'min7', label: 'Min7', intervals: [0, 3, 7, 10] },
  { value: '9', label: '9', intervals: [0, 4, 7, 10, 14] },
  { value: 'maj9', label: 'Maj9', intervals: [0, 4, 7, 11, 14] },
  { value: 'min9', label: 'Min9', intervals: [0, 3, 7, 10, 14] },
  { value: '11', label: '11', intervals: [0, 4, 7, 10, 14, 17] },
  { value: 'min11', label: 'Min11', intervals: [0, 3, 7, 10, 14, 17] },
  { value: 'dim', label: 'Dim', intervals: [0, 3, 6] },
  { value: 'aug', label: 'Aug', intervals: [0, 4, 8] },
  { value: 'sus2', label: 'Sus2', intervals: [0, 2, 7] },
  { value: 'sus4', label: 'Sus4', intervals: [0, 5, 7] },
]
