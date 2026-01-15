import { useState, useCallback, useRef } from 'react'
import type { Note, Pattern, ScaleType, ChordMarker } from '../types'
import { DEFAULT_TEMPO, DEFAULT_VELOCITY, DEFAULT_NOTE_LENGTH, TOTAL_STEPS, STEPS_PER_BAR } from '../types'
import { SCALES, midiToNearestScaleDegree } from '../scales'

const DEFAULT_ROOT_NOTE = 45 // A2 - lower for more range

export function usePattern() {
  const [notes, setNotesState] = useState<Note[]>([])
  const [scale, setScaleState] = useState<ScaleType>('harmonicMinor')
  const [rootNote, setRootNote] = useState(DEFAULT_ROOT_NOTE)
  const [tempo, setTempo] = useState(DEFAULT_TEMPO)
  const [chords, setChords] = useState<ChordMarker[]>([])

  // Selection state (in bars)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(4) // Default 4 bars

  // Clipboard
  const clipboardRef = useRef<Note[]>([])

  const pattern: Pattern = {
    notes,
    scale,
    rootNote,
    tempo
  }

  const setNotes = useCallback((newNotes: Note[]) => {
    setNotesState(newNotes)
  }, [])

  const toggleNote = useCallback((step: number, pitch: number) => {
    setNotesState(prev => {
      const existingIndex = prev.findIndex(
        n => n.step === step && n.pitch === pitch
      )
      if (existingIndex >= 0) {
        return prev.filter((_, i) => i !== existingIndex)
      } else {
        return [...prev, {
          step,
          pitch,
          velocity: DEFAULT_VELOCITY,
          length: DEFAULT_NOTE_LENGTH,
          accent: false
        }]
      }
    })
  }, [])

  const clearPattern = useCallback(() => {
    setNotesState([])
    setChords([])
  }, [])

  const addChord = useCallback((chord: ChordMarker) => {
    setChords(prev => {
      const filtered = prev.filter(c => c.step !== chord.step)
      return [...filtered, chord].sort((a, b) => a.step - b.step)
    })
  }, [])

  const removeChord = useCallback((step: number) => {
    setChords(prev => prev.filter(c => c.step !== step))
  }, [])

  const loadPattern = useCallback((p: {
    notes: Note[]
    scale: ScaleType
    rootNote: number
    tempo: number
  }) => {
    setNotesState(p.notes)
    setScaleState(p.scale)
    setRootNote(p.rootNote)
    setTempo(p.tempo)
  }, [])

  const setScale = useCallback((newScale: ScaleType) => {
    setNotesState(prev => {
      const oldScaleData = SCALES[scale]
      const newScaleData = SCALES[newScale]

      return prev.map(note => {
        const notesPerOctave = oldScaleData.intervals.length
        const octave = Math.floor(note.pitch / notesPerOctave)
        const degreeInOctave = note.pitch % notesPerOctave
        const midiNote = rootNote + octave * 12 + oldScaleData.intervals[degreeInOctave]
        const newPitch = midiToNearestScaleDegree(midiNote, newScaleData, rootNote)
        return { ...note, pitch: newPitch }
      })
    })
    setScaleState(newScale)
  }, [scale, rootNote])

  // Get selection range in steps
  const getSelectionSteps = useCallback(() => {
    const startStep = selectionStart * STEPS_PER_BAR
    const endStep = selectionEnd * STEPS_PER_BAR
    return { startStep, endStep }
  }, [selectionStart, selectionEnd])

  // Copy notes in selection to clipboard
  const copySelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectedNotes = notes.filter(n => n.step >= startStep && n.step < endStep)
    // Normalize to start at step 0
    clipboardRef.current = selectedNotes.map(n => ({
      ...n,
      step: n.step - startStep
    }))
  }, [notes, getSelectionSteps])

  // Cut notes in selection (copy + delete)
  const cutSelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectedNotes = notes.filter(n => n.step >= startStep && n.step < endStep)
    clipboardRef.current = selectedNotes.map(n => ({
      ...n,
      step: n.step - startStep
    }))
    setNotesState(prev => prev.filter(n => n.step < startStep || n.step >= endStep))
  }, [notes, getSelectionSteps])

  // Paste clipboard at selection start
  const pasteAtSelection = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    const { startStep } = getSelectionSteps()
    const pastedNotes = clipboardRef.current.map(n => ({
      ...n,
      step: n.step + startStep
    })).filter(n => n.step < TOTAL_STEPS)

    setNotesState(prev => {
      // Remove existing notes in paste range
      const pasteLength = Math.max(...clipboardRef.current.map(n => n.step)) + 1
      const filtered = prev.filter(n => n.step < startStep || n.step >= startStep + pasteLength)
      return [...filtered, ...pastedNotes]
    })
  }, [getSelectionSteps])

  // Duplicate selection (copy and paste right after)
  const duplicateSelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectionLength = endStep - startStep
    const selectedNotes = notes.filter(n => n.step >= startStep && n.step < endStep)

    // Paste after selection
    const duplicatedNotes = selectedNotes.map(n => ({
      ...n,
      step: n.step + selectionLength
    })).filter(n => n.step < TOTAL_STEPS)

    setNotesState(prev => [...prev, ...duplicatedNotes])

    // Move selection to duplicated area
    setSelectionStart(selectionEnd)
    setSelectionEnd(Math.min(selectionEnd + (selectionEnd - selectionStart), 16))
  }, [notes, getSelectionSteps, selectionStart, selectionEnd])

  // Loop selection (repeat to fill pattern)
  const loopSelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectionLength = endStep - startStep
    if (selectionLength <= 0) return

    const selectedNotes = notes.filter(n => n.step >= startStep && n.step < endStep)
    const newNotes: Note[] = [...notes]

    // Fill from end of selection to end of pattern
    let currentOffset = selectionLength
    while (startStep + currentOffset < TOTAL_STEPS) {
      selectedNotes.forEach(n => {
        const newStep = n.step + currentOffset
        if (newStep < TOTAL_STEPS) {
          // Only add if no note exists at this position
          if (!newNotes.some(existing => existing.step === newStep && existing.pitch === n.pitch)) {
            newNotes.push({ ...n, step: newStep })
          }
        }
      })
      currentOffset += selectionLength
    }

    setNotesState(newNotes)
  }, [notes, getSelectionSteps])

  // Clear selection
  const clearSelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    setNotesState(prev => prev.filter(n => n.step < startStep || n.step >= endStep))
  }, [getSelectionSteps])

  // Add octave down for lowest note at each step
  const addOctaveDown = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const scaleData = SCALES[scale]
    const notesPerOctave = scaleData.intervals.length

    // Group notes by step
    const notesByStep = new Map<number, Note[]>()
    notes.forEach(n => {
      if (n.step >= startStep && n.step < endStep) {
        const existing = notesByStep.get(n.step) || []
        existing.push(n)
        notesByStep.set(n.step, existing)
      }
    })

    const newNotes: Note[] = []
    notesByStep.forEach((stepNotes) => {
      // Find lowest pitch note at this step
      const lowestNote = stepNotes.reduce((lowest, n) =>
        n.pitch < lowest.pitch ? n : lowest
      , stepNotes[0])

      // Calculate pitch one octave down
      const newPitch = lowestNote.pitch - notesPerOctave

      // Only add if within valid range and doesn't already exist
      if (newPitch >= 0) {
        const alreadyExists = notes.some(n =>
          n.step === lowestNote.step && n.pitch === newPitch
        )
        if (!alreadyExists) {
          newNotes.push({
            ...lowestNote,
            pitch: newPitch
          })
        }
      }
    })

    if (newNotes.length > 0) {
      setNotesState(prev => [...prev, ...newNotes])
    }
  }, [notes, scale, getSelectionSteps])

  return {
    pattern,
    notes,
    setNotes,
    toggleNote,
    clearPattern,
    loadPattern,
    scale,
    setScale,
    rootNote,
    setRootNote,
    tempo,
    setTempo,
    chords,
    addChord,
    removeChord,
    setChords,
    // Selection & editing
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    copySelection,
    cutSelection,
    pasteAtSelection,
    duplicateSelection,
    loopSelection,
    clearSelection,
    addOctaveDown
  }
}
