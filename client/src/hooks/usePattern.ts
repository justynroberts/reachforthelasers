import { useState, useCallback, useRef, useMemo } from 'react'
import type { Note, Pattern, ScaleType, ChordMarker } from '../types'
import { DEFAULT_TEMPO, DEFAULT_VELOCITY, DEFAULT_NOTE_LENGTH, TOTAL_STEPS, STEPS_PER_BAR } from '../types'
import { SCALES, midiToNearestScaleDegree } from '../scales'

const DEFAULT_ROOT_NOTE = 45 // A2 - lower for more range
const MAX_HISTORY = 50

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

  // Undo/redo history
  const historyRef = useRef<Note[][]>([[]])
  const historyIndexRef = useRef(0)

  // Push state to history (call this before making changes)
  const pushHistory = useCallback((currentNotes: Note[]) => {
    const history = historyRef.current
    const index = historyIndexRef.current

    // Remove any future states if we're not at the end
    if (index < history.length - 1) {
      history.splice(index + 1)
    }

    // Add new state
    history.push([...currentNotes])

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift()
    } else {
      historyIndexRef.current = history.length - 1
    }
  }, [])

  // Set notes with history tracking
  const setNotesWithHistory = useCallback((newNotes: Note[] | ((prev: Note[]) => Note[])) => {
    setNotesState(prev => {
      const nextNotes = typeof newNotes === 'function' ? newNotes(prev) : newNotes
      pushHistory(prev)
      return nextNotes
    })
  }, [pushHistory])

  const pattern: Pattern = {
    notes,
    scale,
    rootNote,
    tempo
  }

  const setNotes = useCallback((newNotes: Note[]) => {
    setNotesWithHistory(newNotes)
  }, [setNotesWithHistory])

  // Undo - go back in history
  const undo = useCallback(() => {
    const history = historyRef.current
    const index = historyIndexRef.current

    if (index > 0) {
      historyIndexRef.current = index - 1
      setNotesState([...history[index - 1]])
    }
  }, [])

  // Redo - go forward in history
  const redo = useCallback(() => {
    const history = historyRef.current
    const index = historyIndexRef.current

    if (index < history.length - 1) {
      historyIndexRef.current = index + 1
      setNotesState([...history[index + 1]])
    }
  }, [])

  // Check if undo/redo are available
  const canUndo = useMemo(() => historyIndexRef.current > 0, [notes])
  const canRedo = useMemo(() => historyIndexRef.current < historyRef.current.length - 1, [notes])

  const toggleNote = useCallback((step: number, pitch: number) => {
    setNotesWithHistory(prev => {
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
  }, [setNotesWithHistory])

  const clearPattern = useCallback(() => {
    setNotesWithHistory([])
    setChords([])
  }, [setNotesWithHistory])

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
    setNotesWithHistory(p.notes)
    setScaleState(p.scale)
    setRootNote(p.rootNote)
    setTempo(p.tempo)
  }, [setNotesWithHistory, setRootNote, setTempo])

  const setScale = useCallback((newScale: ScaleType) => {
    setNotesWithHistory(prev => {
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
  }, [scale, rootNote, setNotesWithHistory])

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
    setNotesWithHistory(prev => prev.filter(n => n.step < startStep || n.step >= endStep))
  }, [notes, getSelectionSteps, setNotesWithHistory])

  // Paste clipboard at selection start
  const pasteAtSelection = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    const { startStep } = getSelectionSteps()
    const pastedNotes = clipboardRef.current.map(n => ({
      ...n,
      step: n.step + startStep
    })).filter(n => n.step < TOTAL_STEPS)

    setNotesWithHistory(prev => {
      // Remove existing notes in paste range
      const pasteLength = Math.max(...clipboardRef.current.map(n => n.step)) + 1
      const filtered = prev.filter(n => n.step < startStep || n.step >= startStep + pasteLength)
      return [...filtered, ...pastedNotes]
    })
  }, [getSelectionSteps, setNotesWithHistory])

  // Duplicate selection (copy and paste right after, extending the loop)
  const duplicateSelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectionLength = endStep - startStep
    const selectionBars = selectionEnd - selectionStart
    const selectedNotes = notes.filter(n => n.step >= startStep && n.step < endStep)

    // Paste after selection
    const duplicatedNotes = selectedNotes.map(n => ({
      ...n,
      step: n.step + selectionLength
    })).filter(n => n.step < TOTAL_STEPS)

    setNotesWithHistory(prev => [...prev, ...duplicatedNotes])

    // Extend selection to include duplicated area
    const newEnd = Math.min(selectionEnd + selectionBars, 16)
    setSelectionEnd(newEnd)
  }, [notes, getSelectionSteps, selectionStart, selectionEnd, setNotesWithHistory])

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

    setNotesWithHistory(newNotes)
  }, [notes, getSelectionSteps, setNotesWithHistory])

  // Clear selection
  const clearSelection = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    setNotesWithHistory(prev => prev.filter(n => n.step < startStep || n.step >= endStep))
  }, [getSelectionSteps, setNotesWithHistory])

  // Add octave down for the absolute lowest pitch notes in selection
  const addOctaveDown = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const scaleData = SCALES[scale]
    const notesPerOctave = scaleData.intervals.length

    // Get all notes in selection
    const selectionNotes = notes.filter(n => n.step >= startStep && n.step < endStep)
    if (selectionNotes.length === 0) return

    // Find the absolute lowest pitch in the selection
    const lowestPitch = Math.min(...selectionNotes.map(n => n.pitch))

    // Get all notes at the lowest pitch
    const lowestNotes = selectionNotes.filter(n => n.pitch === lowestPitch)

    const newNotes: Note[] = []
    lowestNotes.forEach(note => {
      // Calculate pitch one octave down
      const newPitch = note.pitch - notesPerOctave

      // Only add if within valid range and doesn't already exist
      if (newPitch >= 0) {
        const alreadyExists = notes.some(n =>
          n.step === note.step && n.pitch === newPitch
        )
        if (!alreadyExists) {
          newNotes.push({
            ...note,
            pitch: newPitch
          })
        }
      }
    })

    if (newNotes.length > 0) {
      setNotesWithHistory(prev => [...prev, ...newNotes])
    }
  }, [notes, scale, getSelectionSteps, setNotesWithHistory])

  // Nudge pattern left (rotate) within selection
  const nudgeLeft = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectionLength = endStep - startStep
    if (selectionLength <= 0) return

    setNotesWithHistory(prev => prev.map(n => {
      if (n.step >= startStep && n.step < endStep) {
        // Shift left by 1, wrap around within selection
        let newStep = n.step - 1
        if (newStep < startStep) {
          newStep = endStep - 1
        }
        return { ...n, step: newStep }
      }
      return n
    }))
  }, [getSelectionSteps, setNotesWithHistory])

  // Nudge pattern right (rotate) within selection
  const nudgeRight = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const selectionLength = endStep - startStep
    if (selectionLength <= 0) return

    setNotesWithHistory(prev => prev.map(n => {
      if (n.step >= startStep && n.step < endStep) {
        // Shift right by 1, wrap around within selection
        let newStep = n.step + 1
        if (newStep >= endStep) {
          newStep = startStep
        }
        return { ...n, step: newStep }
      }
      return n
    }))
  }, [getSelectionSteps, setNotesWithHistory])

  // Transpose pattern up by 1 scale degree within selection
  const transposeUp = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()
    const scaleData = SCALES[scale]
    const maxPitch = scaleData.intervals.length * 4 - 1 // 4 octaves

    setNotesWithHistory(prev => prev.map(n => {
      if (n.step >= startStep && n.step < endStep) {
        const newPitch = n.pitch + 1
        if (newPitch <= maxPitch) {
          return { ...n, pitch: newPitch }
        }
      }
      return n
    }))
  }, [scale, getSelectionSteps, setNotesWithHistory])

  // Transpose pattern down by 1 scale degree within selection
  const transposeDown = useCallback(() => {
    const { startStep, endStep } = getSelectionSteps()

    setNotesWithHistory(prev => prev.map(n => {
      if (n.step >= startStep && n.step < endStep) {
        const newPitch = n.pitch - 1
        if (newPitch >= 0) {
          return { ...n, pitch: newPitch }
        }
      }
      return n
    }))
  }, [getSelectionSteps, setNotesWithHistory])

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
    addOctaveDown,
    nudgeLeft,
    nudgeRight,
    transposeUp,
    transposeDown,
    // Undo/redo
    undo,
    redo,
    canUndo,
    canRedo
  }
}
