import type { Note, ScaleType } from '../types'
import { DEFAULT_VELOCITY } from '../types'

export interface Preset {
  name: string
  description: string
  suggestedTempo: number
  recommendedScale: ScaleType
  complexity: 'simple' | 'medium' | 'complex'
  generate: (options: { stepsPerOctave: number; octaves: number }) => Note[]
}

function n(step: number, pitch: number, velocity = DEFAULT_VELOCITY, length = 1, accent = false): Note {
  return { step, pitch, velocity, length, accent }
}

// Helper to repeat a bar pattern across multiple bars
function repeatBars(barPattern: Note[], bars: number, stepsPerBar = 16): Note[] {
  const notes: Note[] = []
  for (let bar = 0; bar < bars; bar++) {
    barPattern.forEach(note => {
      notes.push({ ...note, step: note.step + bar * stepsPerBar })
    })
  }
  return notes
}

export const PRESETS: Preset[] = [
  // === ROLLING PATTERNS ===
  {
    name: 'Rolling 16ths',
    description: 'Classic rolling 16th notes - root and octave',
    suggestedTempo: 140,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: ({ stepsPerOctave }) => {
      // Root-root-octave-root pattern on 16ths
      const bar: Note[] = []
      for (let i = 0; i < 16; i++) {
        const pitch = i % 4 === 2 ? stepsPerOctave : 0
        const vel = i % 4 === 0 ? 110 : i % 2 === 0 ? 95 : 80
        bar.push(n(i, pitch, vel, 1, i === 0))
      }
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Thirds',
    description: 'Rolling pattern with root and third',
    suggestedTempo: 138,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: () => {
      const third = 2
      // Root-third alternating pattern
      const bar: Note[] = []
      for (let i = 0; i < 16; i++) {
        const pitch = i % 2 === 0 ? 0 : third
        const vel = i % 4 === 0 ? 110 : 85
        bar.push(n(i, pitch, vel, 1, i === 0))
      }
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Fifths',
    description: 'Driving root-fifth rolling pattern',
    suggestedTempo: 140,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: () => {
      const fifth = 4
      // Root-root-fifth-root continuous pattern
      const pattern = [0, 0, fifth, 0, 0, fifth, 0, fifth, 0, 0, fifth, 0, fifth, 0, fifth, 0]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 110 : i % 2 === 0 ? 95 : 80, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Arp',
    description: '16th note arpeggio rolling pattern',
    suggestedTempo: 138,
    recommendedScale: 'minor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const third = 2
      const fifth = 4
      // 1-3-5-8 repeating on 16ths
      const pattern = [0, third, fifth, stepsPerOctave]
      const bar: Note[] = []
      for (let i = 0; i < 16; i++) {
        bar.push(n(i, pattern[i % 4], i % 4 === 0 ? 105 : 85, 1, i === 0))
      }
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Octaves',
    description: 'Hypnotic octave jumps on 16ths',
    suggestedTempo: 142,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: ({ stepsPerOctave }) => {
      // Low-low-high-low pattern
      const pattern = [0, 0, stepsPerOctave, 0, 0, 0, stepsPerOctave, stepsPerOctave,
                       0, 0, stepsPerOctave, 0, stepsPerOctave, 0, stepsPerOctave, 0]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 115 : pitch === stepsPerOctave ? 100 : 85, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Acid',
    description: '303-style rolling acid line',
    suggestedTempo: 140,
    recommendedScale: 'phrygian',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      // Acid pattern with slides implied by velocity
      const pattern = [0, 0, stepsPerOctave, 0, 1, 0, stepsPerOctave, 1,
                       0, 2, 0, stepsPerOctave, 0, 1, 2, 0]
      const accents = [0, 2, 4, 6, 8, 10, 12, 14]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, accents.includes(i) ? 120 : 75, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Groove',
    description: 'Syncopated rolling groove',
    suggestedTempo: 138,
    recommendedScale: 'minor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const fifth = 4
      // Groove with syncopation
      const pattern = [0, fifth, 0, stepsPerOctave, fifth, 0, stepsPerOctave, 0,
                       fifth, 0, stepsPerOctave, fifth, 0, stepsPerOctave, 0, fifth]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 110 : i % 2 === 0 ? 90 : 75, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Tension',
    description: 'Building tension with minor second',
    suggestedTempo: 142,
    recommendedScale: 'phrygianDominant',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      // Dark pattern with minor 2nd for tension
      const pattern = [0, 0, 1, 0, 0, 1, 0, stepsPerOctave,
                       0, 1, 0, 0, 1, 0, stepsPerOctave, 0]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 115 : pitch === 1 ? 100 : 80, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Wide',
    description: 'Wide interval rolling pattern',
    suggestedTempo: 140,
    recommendedScale: 'minor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const fifth = 4
      // Root to high octave+fifth jumps
      const highFifth = stepsPerOctave + fifth
      const pattern = [0, fifth, 0, stepsPerOctave, 0, highFifth, 0, stepsPerOctave,
                       0, fifth, stepsPerOctave, 0, highFifth, stepsPerOctave, fifth, 0]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 110 : pitch >= stepsPerOctave ? 95 : 80, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Psy',
    description: 'Psytrance-style rolling bassline',
    suggestedTempo: 145,
    recommendedScale: 'phrygianDominant',
    complexity: 'simple',
    generate: () => {
      // Pure root note driving psytrance bass
      const notes: Note[] = []
      for (let bar = 0; bar < 16; bar++) {
        for (let i = 0; i < 16; i++) {
          const vel = i % 4 === 0 ? 120 : i % 2 === 0 ? 100 : 85
          notes.push(n(bar * 16 + i, 0, vel, 1, i === 0))
        }
      }
      return notes
    }
  },
  {
    name: 'Rolling Morph',
    description: 'Morphing pattern that evolves',
    suggestedTempo: 138,
    recommendedScale: 'minor',
    complexity: 'complex',
    generate: ({ stepsPerOctave }) => {
      const third = 2
      const fifth = 4
      const notes: Note[] = []

      // Pattern evolves every 4 bars
      const patterns = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],           // Just root
        [0, 0, third, 0, 0, 0, third, 0, 0, 0, third, 0, 0, third, 0, 0], // Add thirds
        [0, third, fifth, 0, 0, third, fifth, 0, 0, third, fifth, 0, third, fifth, 0, 0], // Add fifths
        [0, third, fifth, stepsPerOctave, 0, third, fifth, stepsPerOctave, 0, third, fifth, stepsPerOctave, third, fifth, stepsPerOctave, 0] // Full arp
      ]

      for (let bar = 0; bar < 16; bar++) {
        const patternIndex = Math.floor(bar / 4)
        const pattern = patterns[patternIndex]
        for (let i = 0; i < 16; i++) {
          notes.push(n(bar * 16 + i, pattern[i], i % 4 === 0 ? 110 : 85, 1, i === 0))
        }
      }
      return notes
    }
  },
  {
    name: 'Rolling Pendulum',
    description: 'Swinging pendulum-like pattern',
    suggestedTempo: 140,
    recommendedScale: 'minor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const fifth = 4
      // Up and down wave
      const pattern = [0, 2, fifth, stepsPerOctave, stepsPerOctave, fifth, 2, 0,
                       0, 2, fifth, stepsPerOctave, stepsPerOctave, fifth, 2, 0]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 8 === 0 ? 110 : i % 4 === 0 ? 100 : 85, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Stutter',
    description: 'Stuttering 16th note pattern',
    suggestedTempo: 142,
    recommendedScale: 'minor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      // Stutter effect with repeated notes
      const pattern = [0, 0, 0, stepsPerOctave, 0, 0, 0, stepsPerOctave,
                       0, 0, stepsPerOctave, stepsPerOctave, 0, stepsPerOctave, 0, stepsPerOctave]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 115 : pitch === stepsPerOctave ? 100 : 80, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Tech',
    description: 'Tech-trance style rolling riff',
    suggestedTempo: 145,
    recommendedScale: 'phrygian',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      // Driving tech pattern
      const pattern = [0, 0, 1, 0, 0, 1, stepsPerOctave, 0,
                       0, 1, 0, stepsPerOctave, 0, 1, 0, stepsPerOctave]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, i % 4 === 0 ? 120 : pitch === stepsPerOctave ? 105 : 85, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  },
  {
    name: 'Rolling Uplifter',
    description: 'Gradually rising rolling pattern',
    suggestedTempo: 140,
    recommendedScale: 'major',
    complexity: 'complex',
    generate: () => {
      const notes: Note[] = []
      const basePattern = [0, 2, 4, 5]

      for (let bar = 0; bar < 16; bar++) {
        const rise = Math.floor(bar / 4) // Rise every 4 bars
        for (let i = 0; i < 16; i++) {
          const pitch = basePattern[i % 4] + rise
          notes.push(n(bar * 16 + i, pitch, i % 4 === 0 ? 110 : 85, 1, i === 0))
        }
      }
      return notes
    }
  },
  {
    name: 'Rolling Bounce',
    description: 'Bouncy triplet-feel rolling',
    suggestedTempo: 138,
    recommendedScale: 'minor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const fifth = 4
      // Bouncy pattern - accents create triplet feel
      const pattern = [0, fifth, 0, 0, fifth, stepsPerOctave, 0, fifth,
                       0, 0, fifth, 0, stepsPerOctave, fifth, 0, 0]
      const accents = [0, 3, 6, 9, 12, 15]
      const bar: Note[] = pattern.map((pitch, i) =>
        n(i, pitch, accents.includes(i) ? 115 : 80, 1, i === 0)
      )
      return repeatBars(bar, 16)
    }
  }
]

export function getPresetByName(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name)
}
