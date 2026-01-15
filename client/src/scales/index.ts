import type { Scale, ScaleType } from '../types'

export const SCALES: Record<ScaleType, Scale> = {
  chromatic: {
    name: 'Chromatic (All Notes)',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  },
  major: {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11]
  },
  minor: {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10]
  },
  harmonicMinor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11]
  },
  melodicMinor: {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11]
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10]
  },
  phrygian: {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10]
  },
  phrygianDominant: {
    name: 'Phrygian Dominant',
    intervals: [0, 1, 4, 5, 7, 8, 10]
  },
  lydian: {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11]
  },
  mixolydian: {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10]
  },
  wholeTone: {
    name: 'Whole Tone',
    intervals: [0, 2, 4, 6, 8, 10]
  },
  diminished: {
    name: 'Diminished (Half-Whole)',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10]
  },
  pentatonicMajor: {
    name: 'Pentatonic Major',
    intervals: [0, 2, 4, 7, 9]
  },
  pentatonicMinor: {
    name: 'Pentatonic Minor',
    intervals: [0, 3, 5, 7, 10]
  },
  blues: {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10]
  }
}

/**
 * Get all MIDI note numbers for a scale across multiple octaves
 */
export function getScaleNotes(
  scale: Scale,
  rootNote: number,
  octaves: number = 3
): number[] {
  const notes: number[] = []
  for (let octave = 0; octave < octaves; octave++) {
    for (const interval of scale.intervals) {
      notes.push(rootNote + octave * 12 + interval)
    }
  }
  // Add the root of the next octave to complete the range
  notes.push(rootNote + octaves * 12)
  return notes
}

/**
 * Convert scale degree index to MIDI note number
 */
export function scaleDegreeToMidi(
  degree: number,
  scale: Scale,
  rootNote: number
): number {
  const notesPerOctave = scale.intervals.length
  const octave = Math.floor(degree / notesPerOctave)
  const degreeInOctave = degree % notesPerOctave
  return rootNote + octave * 12 + scale.intervals[degreeInOctave]
}

/**
 * Find the nearest scale degree for a given MIDI note
 */
export function midiToNearestScaleDegree(
  midiNote: number,
  scale: Scale,
  rootNote: number
): number {
  const semitones = midiNote - rootNote
  const octave = Math.floor(semitones / 12)
  const noteInOctave = ((semitones % 12) + 12) % 12

  // Find nearest interval
  let nearestIndex = 0
  let minDistance = Infinity
  for (let i = 0; i < scale.intervals.length; i++) {
    const distance = Math.abs(scale.intervals[i] - noteInOctave)
    if (distance < minDistance) {
      minDistance = distance
      nearestIndex = i
    }
  }

  return octave * scale.intervals.length + nearestIndex
}

/**
 * Get display name for a MIDI note number
 */
export function midiToNoteName(midiNote: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midiNote / 12) - 1
  const noteName = noteNames[midiNote % 12]
  return `${noteName}${octave}`
}
