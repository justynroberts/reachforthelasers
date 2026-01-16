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

export const PRESETS: Preset[] = [
  {
    name: 'Offbeat',
    description: 'Simple offbeat pattern',
    suggestedTempo: 138,
    recommendedScale: 'minor',
    complexity: 'simple',
    generate: () => {
      const notes: Note[] = []
      // Offbeat hits on every other 8th note (steps 2, 6, 10, 14)
      for (let bar = 0; bar < 4; bar++) {
        for (let i = 0; i < 4; i++) {
          const step = bar * 16 + i * 4 + 2
          notes.push(n(step, 0, 100, 1, false))
        }
      }
      return notes
    }
  }
]

export function getPresetByName(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name)
}
