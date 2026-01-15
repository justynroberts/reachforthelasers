import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChordMarker, ChordQuality } from '../../types'
import { NOTE_NAMES, CHORD_QUALITIES, CHORD_DURATIONS, TOTAL_STEPS, STEPS_PER_BAR, MIN_CHORD_DURATION } from '../../types'

interface ChordTrackProps {
  chords: ChordMarker[]
  onAddChord: (chord: ChordMarker) => void
  onRemoveChord: (step: number) => void
  currentStep: number
  isPlaying: boolean
}

const CELL_WIDTH = 24
const TRACK_HEIGHT = 48
const PITCH_LABEL_WIDTH = 48
const RESIZE_HANDLE_WIDTH = 8

type DragMode = 'none' | 'move' | 'resize-left' | 'resize-right'

export function ChordTrack({
  chords,
  onAddChord,
  onRemoveChord,
  currentStep,
  isPlaying
}: ChordTrackProps) {
  const [editingChord, setEditingChord] = useState<{ step: number; chord?: ChordMarker } | null>(null)
  const [selectedRoot, setSelectedRoot] = useState(0)
  const [selectedQuality, setSelectedQuality] = useState<ChordQuality>('maj')
  const [selectedDuration, setSelectedDuration] = useState(STEPS_PER_BAR)

  // Drag state
  const [dragMode, setDragMode] = useState<DragMode>('none')
  const [dragChord, setDragChord] = useState<ChordMarker | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragPreview, setDragPreview] = useState<{ step: number; duration: number } | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)

  // Snap to quarter-bar boundaries (4 steps)
  const snapToGrid = (step: number) => Math.round(step / MIN_CHORD_DURATION) * MIN_CHORD_DURATION

  const getStepFromX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const scrollLeft = trackRef.current?.parentElement?.scrollLeft || 0
    const x = clientX - rect.left + scrollLeft
    return Math.floor(x / CELL_WIDTH)
  }

  // Find constraints for a chord (min/max positions)
  const getChordConstraints = (chord: ChordMarker) => {
    let minStep = 0
    let maxEnd = TOTAL_STEPS

    for (const c of chords) {
      if (c.step === chord.step) continue
      // Chord before this one
      if (c.step + c.duration <= chord.step) {
        minStep = Math.max(minStep, c.step + c.duration)
      }
      // Chord after this one
      if (c.step >= chord.step + chord.duration) {
        maxEnd = Math.min(maxEnd, c.step)
      }
    }

    return { minStep, maxEnd }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, chord: ChordMarker, mode: DragMode) => {
    e.stopPropagation()
    e.preventDefault()
    setDragMode(mode)
    setDragChord(chord)
    setDragStartX(e.clientX)
    setDragPreview({ step: chord.step, duration: chord.duration })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragMode === 'none' || !dragChord || !dragPreview) return

    const currentStep = getStepFromX(e.clientX)
    const { minStep, maxEnd } = getChordConstraints(dragChord)

    if (dragMode === 'move') {
      // Move the entire chord
      const deltaSteps = currentStep - getStepFromX(dragStartX)
      let newStep = snapToGrid(dragChord.step + deltaSteps)

      // Constrain to boundaries
      newStep = Math.max(minStep, newStep)
      newStep = Math.min(maxEnd - dragChord.duration, newStep)
      newStep = Math.max(0, newStep)

      setDragPreview({ step: newStep, duration: dragChord.duration })
    } else if (dragMode === 'resize-left') {
      // Resize from left edge
      let newStep = snapToGrid(currentStep)
      newStep = Math.max(minStep, newStep)
      newStep = Math.min(dragChord.step + dragChord.duration - MIN_CHORD_DURATION, newStep)

      const newDuration = dragChord.step + dragChord.duration - newStep
      setDragPreview({ step: newStep, duration: newDuration })
    } else if (dragMode === 'resize-right') {
      // Resize from right edge
      let newEnd = snapToGrid(currentStep)
      newEnd = Math.min(maxEnd, newEnd)
      newEnd = Math.max(dragChord.step + MIN_CHORD_DURATION, newEnd)

      const newDuration = newEnd - dragChord.step
      setDragPreview({ step: dragChord.step, duration: newDuration })
    }
  }, [dragMode, dragChord, dragPreview, dragStartX, chords])

  const handleMouseUp = useCallback(() => {
    if (dragMode !== 'none' && dragChord && dragPreview) {
      // Apply the change
      onRemoveChord(dragChord.step)
      onAddChord({
        ...dragChord,
        step: dragPreview.step,
        duration: dragPreview.duration
      })
    }

    setDragMode('none')
    setDragChord(null)
    setDragPreview(null)
  }, [dragMode, dragChord, dragPreview, onAddChord, onRemoveChord])

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragMode !== 'none') {
        handleMouseUp()
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [dragMode, handleMouseUp])

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (dragMode !== 'none') return

    const step = getStepFromX(e.clientX)
    if (step < 0 || step >= TOTAL_STEPS) return

    // Snap to beat boundaries (4 steps) for finer control
    const snappedStep = snapToGrid(step)

    // Check if clicking inside an existing chord's range
    const existingChord = chords.find(c =>
      step >= c.step && step < c.step + c.duration
    )

    if (existingChord) {
      setSelectedRoot(existingChord.root)
      setSelectedQuality(existingChord.quality)
      setSelectedDuration(existingChord.duration)
      setEditingChord({ step: existingChord.step, chord: existingChord })
    } else {
      const maxDuration = TOTAL_STEPS - snappedStep
      const defaultDuration = Math.min(STEPS_PER_BAR, maxDuration) // Default to 1 bar
      setSelectedDuration(defaultDuration)
      setEditingChord({ step: snappedStep, chord: undefined })
    }
  }, [chords, dragMode])

  const handleSaveChord = () => {
    if (editingChord) {
      const maxAllowed = getMaxDuration(editingChord.step, editingChord.chord?.step)
      const finalDuration = Math.min(selectedDuration, maxAllowed)

      onAddChord({
        step: editingChord.step,
        root: selectedRoot,
        quality: selectedQuality,
        duration: finalDuration
      })
      setEditingChord(null)
    }
  }

  const handleDeleteChord = () => {
    if (editingChord?.chord) {
      onRemoveChord(editingChord.chord.step)
      setEditingChord(null)
    }
  }

  const getMaxDuration = (step: number, excludeStep?: number) => {
    let maxDuration = TOTAL_STEPS - step
    for (const chord of chords) {
      if (chord.step !== excludeStep && chord.step > step) {
        maxDuration = Math.min(maxDuration, chord.step - step)
      }
    }
    return maxDuration
  }

  const formatChord = (chord: ChordMarker) => {
    const rootName = NOTE_NAMES[chord.root]
    const quality = CHORD_QUALITIES.find(q => q.value === chord.quality)
    return `${rootName}${quality?.label === 'Major' ? '' : quality?.label || ''}`
  }

  const formatDuration = (steps: number) => {
    const bars = steps / STEPS_PER_BAR
    if (bars === 1) return '1 bar'
    return `${bars} bars`
  }

  const gridWidth = TOTAL_STEPS * CELL_WIDTH

  const getAvailableDurations = () => {
    if (!editingChord) return CHORD_DURATIONS
    const maxDuration = getMaxDuration(editingChord.step, editingChord.chord?.step)
    return CHORD_DURATIONS.filter(d => d.value <= maxDuration)
  }

  const renderChord = (chord: ChordMarker, isPreview = false) => {
    const displayStep = isPreview && dragPreview ? dragPreview.step : chord.step
    const displayDuration = isPreview && dragPreview ? dragPreview.duration : chord.duration
    const isDragging = dragChord?.step === chord.step

    return (
      <div
        key={chord.step}
        className={`absolute flex items-center text-xs font-medium rounded overflow-hidden select-none ${
          isDragging ? 'bg-purple-500 opacity-75' : 'bg-purple-600 hover:bg-purple-500'
        } text-white`}
        style={{
          left: displayStep * CELL_WIDTH + 2,
          top: 8,
          width: displayDuration * CELL_WIDTH - 4,
          height: TRACK_HEIGHT - 16,
          cursor: dragMode === 'none' ? 'grab' : 'grabbing'
        }}
      >
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 h-full bg-purple-400 opacity-0 hover:opacity-100 cursor-ew-resize"
          style={{ width: RESIZE_HANDLE_WIDTH }}
          onMouseDown={(e) => handleMouseDown(e, chord, 'resize-left')}
        />

        {/* Move area (center) */}
        <div
          className="flex-1 flex items-center justify-between px-2 cursor-grab"
          onMouseDown={(e) => handleMouseDown(e, chord, 'move')}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setSelectedRoot(chord.root)
            setSelectedQuality(chord.quality)
            setSelectedDuration(chord.duration)
            setEditingChord({ step: chord.step, chord })
          }}
        >
          <span className="truncate">{formatChord(chord)}</span>
          {displayDuration >= STEPS_PER_BAR * 2 && (
            <span className="text-purple-200 text-[10px] ml-1">
              {formatDuration(displayDuration)}
            </span>
          )}
        </div>

        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 h-full bg-purple-400 opacity-0 hover:opacity-100 cursor-ew-resize"
          style={{ width: RESIZE_HANDLE_WIDTH }}
          onMouseDown={(e) => handleMouseDown(e, chord, 'resize-right')}
        />
      </div>
    )
  }

  return (
    <div
      className="relative border-b border-grid-line"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => dragMode !== 'none' && handleMouseUp()}
    >
      {/* Label */}
      <div
        className="absolute left-0 top-0 h-full flex items-center justify-end pr-2 text-xs text-gray-500 bg-grid-bg z-10"
        style={{ width: PITCH_LABEL_WIDTH }}
      >
        Chords
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="cursor-pointer relative"
        style={{
          marginLeft: PITCH_LABEL_WIDTH,
          width: gridWidth,
          height: TRACK_HEIGHT,
          background: '#0d0d14'
        }}
        onClick={handleTrackClick}
      >
        {/* Bar lines */}
        <svg width={gridWidth} height={TRACK_HEIGHT} className="absolute pointer-events-none">
          {Array.from({ length: TOTAL_STEPS / STEPS_PER_BAR + 1 }).map((_, i) => (
            <line
              key={i}
              x1={i * STEPS_PER_BAR * CELL_WIDTH}
              y1={0}
              x2={i * STEPS_PER_BAR * CELL_WIDTH}
              y2={TRACK_HEIGHT}
              stroke={i % 4 === 0 ? '#3d3d5c' : '#2d2d44'}
              strokeWidth={i % 4 === 0 ? 2 : 1}
            />
          ))}
        </svg>

        {/* Chord markers */}
        {chords.map(chord => renderChord(chord, dragChord?.step === chord.step))}

        {/* Playhead */}
        {isPlaying && currentStep >= 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-yellow-400 opacity-50 pointer-events-none"
            style={{ left: currentStep * CELL_WIDTH }}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingChord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-grid-bg border border-grid-line rounded-lg p-4 w-96">
            <h3 className="text-sm font-medium mb-3">
              {editingChord.chord ? 'Edit' : 'Add'} Chord at Bar {Math.floor(editingChord.step / STEPS_PER_BAR) + 1}
            </h3>

            <div className="space-y-3">
              {/* Root selection */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Root Note</label>
                <div className="grid grid-cols-6 gap-1">
                  {NOTE_NAMES.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => setSelectedRoot(i)}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedRoot === i
                          ? 'bg-purple-600 text-white'
                          : 'bg-grid-line text-gray-300 hover:bg-grid-bar'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality selection */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quality</label>
                <div className="grid grid-cols-4 gap-1">
                  {CHORD_QUALITIES.map(q => (
                    <button
                      key={q.value}
                      onClick={() => setSelectedQuality(q.value)}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedQuality === q.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-grid-line text-gray-300 hover:bg-grid-bar'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration selection */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration</label>
                <div className="grid grid-cols-5 gap-1">
                  {getAvailableDurations().map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDuration(d.value)}
                      className={`px-2 py-1.5 text-xs rounded ${
                        selectedDuration === d.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-grid-line text-gray-300 hover:bg-grid-bar'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-between py-2 px-3 bg-grid-line rounded">
                <span className="text-lg font-medium text-purple-400">
                  {NOTE_NAMES[selectedRoot]}
                  {CHORD_QUALITIES.find(q => q.value === selectedQuality)?.label === 'Major'
                    ? ''
                    : CHORD_QUALITIES.find(q => q.value === selectedQuality)?.label}
                </span>
                <span className="text-sm text-gray-400">
                  {formatDuration(selectedDuration)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {editingChord.chord && (
                  <button
                    onClick={handleDeleteChord}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                  >
                    Delete
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => setEditingChord(null)}
                  className="px-3 py-1.5 bg-grid-line text-gray-300 rounded text-sm hover:bg-grid-bar"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChord}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-500"
                >
                  {editingChord.chord ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
