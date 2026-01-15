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

function createNote(step: number, pitch: number, velocity = DEFAULT_VELOCITY, length = 1, accent = false): Note {
  return { step, pitch, velocity, length, accent }
}

export const PRESETS: Preset[] = [
  {
    name: 'Classic Uplifter',
    description: 'Rising 2-octave sequence with octave jumps',
    suggestedTempo: 138,
    recommendedScale: 'harmonicMinor',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      for (let bar = 0; bar < 16; bar++) {
        for (let beat = 0; beat < 4; beat++) {
          const step = bar * 16 + beat * 4
          const pitch = (bar % 2) * stepsPerOctave + beat
          notes.push(createNote(step, pitch, 100, 1, beat === 0))
          notes.push(createNote(step + 1, pitch + 2))
          notes.push(createNote(step + 2, pitch + 4))
          notes.push(createNote(step + 3, pitch + stepsPerOctave))
        }
      }
      return notes
    }
  },
  {
    name: 'Gater',
    description: 'Rhythmic gate pattern with gaps',
    suggestedTempo: 140,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      const pattern = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1]
      for (let bar = 0; bar < 16; bar++) {
        const basePitch = (bar % 4) * 2
        for (let i = 0; i < 16; i++) {
          if (pattern[i]) {
            const pitch = basePitch + (i % 2 === 0 ? 0 : stepsPerOctave)
            notes.push(createNote(bar * 16 + i, pitch, 90 + (i === 0 ? 20 : 0)))
          }
        }
      }
      return notes
    }
  },
  {
    name: 'Trancer',
    description: 'Root-fifth-octave bounce - classic trance arp',
    suggestedTempo: 138,
    recommendedScale: 'harmonicMinor',
    complexity: 'simple',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      // Root (0), fifth (4 in most scales), octave (stepsPerOctave)
      const fifth = Math.floor(stepsPerOctave * 4 / 7) // Approximate fifth
      const bouncePattern = [0, fifth, stepsPerOctave, fifth]

      for (let bar = 0; bar < 16; bar++) {
        const variation = Math.floor(bar / 4) % 2
        for (let beat = 0; beat < 4; beat++) {
          for (let sub = 0; sub < 4; sub++) {
            const step = bar * 16 + beat * 4 + sub
            const pitch = bouncePattern[sub] + variation * 2
            notes.push(createNote(step, pitch, beat === 0 && sub === 0 ? 110 : 90))
          }
        }
      }
      return notes
    }
  },
  {
    name: 'Psy Roll',
    description: 'Psytrance rolling pattern with subtle variation',
    suggestedTempo: 145,
    recommendedScale: 'phrygianDominant',
    complexity: 'complex',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      for (let bar = 0; bar < 16; bar++) {
        const barOffset = bar % 4
        for (let i = 0; i < 16; i++) {
          const pitch = ((i + barOffset) % 3) + (Math.floor(i / 4) % 2) * stepsPerOctave
          const velocity = 85 + (i % 4 === 0 ? 20 : 0) + (i === 0 ? 10 : 0)
          notes.push(createNote(bar * 16 + i, pitch, velocity))
        }
      }
      return notes
    }
  },
  {
    name: 'Chord Stab',
    description: 'Power chord rhythm on downbeats',
    suggestedTempo: 136,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      const fifth = Math.floor(stepsPerOctave * 4 / 7)

      for (let bar = 0; bar < 16; bar++) {
        const baseOffset = (bar % 4) * 1
        // Hit on 1 and 3
        for (const beat of [0, 8]) {
          const step = bar * 16 + beat
          notes.push(createNote(step, baseOffset, 110, 2, true)) // Root
          notes.push(createNote(step, baseOffset + fifth, 100, 2)) // Fifth
          notes.push(createNote(step, baseOffset + stepsPerOctave, 95, 2)) // Octave
        }
      }
      return notes
    }
  },
  {
    name: 'Elevator',
    description: 'Continuous ascending sequence that wraps',
    suggestedTempo: 140,
    recommendedScale: 'melodicMinor',
    complexity: 'medium',
    generate: ({ stepsPerOctave, octaves }) => {
      const notes: Note[] = []
      const totalPitches = stepsPerOctave * octaves
      for (let i = 0; i < 256; i++) {
        const pitch = i % totalPitches
        notes.push(createNote(i, pitch, 90 + (i % 16 === 0 ? 20 : 0)))
      }
      return notes
    }
  },
  {
    name: 'Waterfall',
    description: 'Continuous descending sequence that wraps',
    suggestedTempo: 140,
    recommendedScale: 'harmonicMinor',
    complexity: 'medium',
    generate: ({ stepsPerOctave, octaves }) => {
      const notes: Note[] = []
      const totalPitches = stepsPerOctave * octaves
      for (let i = 0; i < 256; i++) {
        const pitch = (totalPitches - 1) - (i % totalPitches)
        notes.push(createNote(i, pitch, 90 + (i % 16 === 0 ? 20 : 0)))
      }
      return notes
    }
  },
  {
    name: 'Pendulum',
    description: 'Up-down oscillation between ranges',
    suggestedTempo: 138,
    recommendedScale: 'dorian',
    complexity: 'medium',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      const range = stepsPerOctave + 4
      for (let bar = 0; bar < 16; bar++) {
        for (let i = 0; i < 16; i++) {
          const step = bar * 16 + i
          // Ping pong within range
          const pos = (step % (range * 2))
          const pitch = pos < range ? pos : (range * 2 - pos - 1)
          notes.push(createNote(step, pitch, i === 0 ? 110 : 90))
        }
      }
      return notes
    }
  },
  {
    name: 'Random Seed',
    description: 'Algorithmic weighted random within scale',
    suggestedTempo: 138,
    recommendedScale: 'pentatonicMinor',
    complexity: 'complex',
    generate: ({ stepsPerOctave, octaves }) => {
      const notes: Note[] = []
      const totalPitches = stepsPerOctave * octaves
      // Seeded random for reproducibility
      let seed = 42
      const random = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648
        return seed / 2147483648
      }

      let lastPitch = Math.floor(totalPitches / 2)
      for (let i = 0; i < 256; i++) {
        // Bias towards staying close to last pitch
        const jump = Math.floor(random() * 5) - 2
        let pitch = lastPitch + jump
        pitch = Math.max(0, Math.min(totalPitches - 1, pitch))

        // Skip some steps for breathing room
        if (random() > 0.15) {
          notes.push(createNote(i, pitch, 70 + Math.floor(random() * 40)))
          lastPitch = pitch
        }
      }
      return notes
    }
  },
  {
    name: 'Minimalist',
    description: 'Sparse pattern with lots of space',
    suggestedTempo: 132,
    recommendedScale: 'major',
    complexity: 'simple',
    generate: ({ stepsPerOctave }) => {
      const notes: Note[] = []
      const hitPattern = [0, 6, 10, 12] // Sparse hits within each bar

      for (let bar = 0; bar < 16; bar++) {
        const variation = bar % 4
        for (const hit of hitPattern) {
          // Skip some hits based on bar
          if (bar % 2 === 1 && hit === 6) continue

          const step = bar * 16 + hit
          const pitch = (variation * 2) % stepsPerOctave
          notes.push(createNote(step, pitch, hit === 0 ? 100 : 85, 2))
        }
      }
      return notes
    }
  }
]

export function getPresetByName(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name)
}
