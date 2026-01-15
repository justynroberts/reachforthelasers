import { useRef, useEffect, useCallback, useState } from 'react'
import type { Note, Scale } from '../../types'
import { TOTAL_STEPS, STEPS_PER_BAR, OCTAVE_RANGE } from '../../types'
import { getScaleNotes, midiToNoteName } from '../../scales'

interface GridProps {
  notes: Note[]
  scale: Scale
  rootNote: number
  currentStep: number
  isPlaying: boolean
  onToggleNote: (step: number, pitch: number) => void
  onNotesChange: (notes: Note[]) => void
  centerTrigger?: number // Increment to trigger auto-centering on notes
  scrollContainerRef?: React.RefObject<HTMLDivElement> // External scroll container
}

const CELL_WIDTH = 24
const CELL_HEIGHT = 20
const HEADER_HEIGHT = 32
const PITCH_LABEL_WIDTH = 48

export function Grid({
  notes,
  scale,
  rootNote,
  currentStep,
  isPlaying,
  onToggleNote,
  centerTrigger,
  scrollContainerRef,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add')
  const lastCellRef = useRef<{ step: number; pitch: number } | null>(null)

  const scaleNotes = getScaleNotes(scale, rootNote, OCTAVE_RANGE)
  const pitchCount = scaleNotes.length

  const gridWidth = TOTAL_STEPS * CELL_WIDTH
  const gridHeight = pitchCount * CELL_HEIGHT

  // Create a Set for quick note lookup
  const noteSet = new Set(notes.map(n => `${n.step},${n.pitch}`))

  const getCellFromPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    // getBoundingClientRect already accounts for scroll position
    const x = clientX - rect.left - PITCH_LABEL_WIDTH
    const y = clientY - rect.top - HEADER_HEIGHT

    if (x < 0 || y < 0) return null

    const step = Math.floor(x / CELL_WIDTH)
    const pitch = pitchCount - 1 - Math.floor(y / CELL_HEIGHT)

    if (step < 0 || step >= TOTAL_STEPS || pitch < 0 || pitch >= pitchCount) {
      return null
    }

    return { step, pitch }
  }, [pitchCount])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Left click only

    const cell = getCellFromPosition(e.clientX, e.clientY)
    if (!cell) return

    const hasNote = noteSet.has(`${cell.step},${cell.pitch}`)
    setDragMode(hasNote ? 'remove' : 'add')
    setIsDragging(true)
    lastCellRef.current = cell
    onToggleNote(cell.step, cell.pitch)
  }, [getCellFromPosition, noteSet, onToggleNote])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const cell = getCellFromPosition(e.clientX, e.clientY)
    if (!cell) return

    // Avoid re-triggering same cell
    if (lastCellRef.current?.step === cell.step && lastCellRef.current?.pitch === cell.pitch) {
      return
    }

    lastCellRef.current = cell
    const hasNote = noteSet.has(`${cell.step},${cell.pitch}`)

    if ((dragMode === 'add' && !hasNote) || (dragMode === 'remove' && hasNote)) {
      onToggleNote(cell.step, cell.pitch)
    }
  }, [isDragging, dragMode, getCellFromPosition, noteSet, onToggleNote])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    lastCellRef.current = null
  }, [])

  // Auto-center on notes when centerTrigger changes
  useEffect(() => {
    if (centerTrigger === undefined || centerTrigger === 0) return
    if (notes.length === 0) return

    // Use setTimeout to ensure tab switch and render is complete
    const timeoutId = setTimeout(() => {
      const container = scrollContainerRef?.current
      if (!container) return

      // Find the min and max pitch in the notes
      const pitches = notes.map(n => n.pitch)
      const minPitch = Math.min(...pitches)
      const maxPitch = Math.max(...pitches)
      const centerPitch = (minPitch + maxPitch) / 2

      // Calculate the scroll position to center the notes
      // Pitch 0 is at the bottom, higher pitches are at the top
      const containerHeight = container.clientHeight

      // Account for ChordTrack height (48px) at the top of scroll container
      const CHORD_TRACK_HEIGHT = 48

      // The row for centerPitch (from top of grid area, after chord track)
      const centerRowFromTop = CHORD_TRACK_HEIGHT + (pitchCount - 1 - centerPitch) * CELL_HEIGHT + HEADER_HEIGHT

      // Scroll so this row is in the center of the viewport
      const targetScrollY = centerRowFromTop - containerHeight / 2 + CELL_HEIGHT / 2

      container.scrollTop = Math.max(0, targetScrollY)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [centerTrigger, notes, pitchCount, scrollContainerRef])

  // Draw grid
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = (gridWidth + PITCH_LABEL_WIDTH) * dpr
    canvas.height = (gridHeight + HEADER_HEIGHT) * dpr
    canvas.style.width = `${gridWidth + PITCH_LABEL_WIDTH}px`
    canvas.style.height = `${gridHeight + HEADER_HEIGHT}px`
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, gridWidth + PITCH_LABEL_WIDTH, gridHeight + HEADER_HEIGHT)

    // Draw pitch labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px JetBrains Mono'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < pitchCount; i++) {
      const y = HEADER_HEIGHT + (pitchCount - 1 - i) * CELL_HEIGHT + CELL_HEIGHT / 2
      const midiNote = scaleNotes[i]
      ctx.fillText(midiToNoteName(midiNote), PITCH_LABEL_WIDTH - 8, y)
    }

    // Draw bar numbers in header
    ctx.fillStyle = '#9ca3af'
    ctx.textAlign = 'center'
    for (let bar = 0; bar < 16; bar++) {
      const x = PITCH_LABEL_WIDTH + bar * STEPS_PER_BAR * CELL_WIDTH + (STEPS_PER_BAR * CELL_WIDTH) / 2
      ctx.fillText(`${bar + 1}`, x, HEADER_HEIGHT / 2)
    }

    // Draw grid lines
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1

    // Horizontal lines
    for (let i = 0; i <= pitchCount; i++) {
      const y = HEADER_HEIGHT + i * CELL_HEIGHT
      ctx.beginPath()
      ctx.moveTo(PITCH_LABEL_WIDTH, y)
      ctx.lineTo(PITCH_LABEL_WIDTH + gridWidth, y)
      ctx.stroke()
    }

    // Vertical lines (beat and bar markers)
    for (let i = 0; i <= TOTAL_STEPS; i++) {
      const x = PITCH_LABEL_WIDTH + i * CELL_WIDTH
      const isBar = i % STEPS_PER_BAR === 0
      const isBeat = i % 4 === 0

      ctx.strokeStyle = isBar ? '#3d3d5c' : isBeat ? '#2d2d44' : '#1a1a2e'
      ctx.lineWidth = isBar ? 2 : 1

      ctx.beginPath()
      ctx.moveTo(x, HEADER_HEIGHT)
      ctx.lineTo(x, HEADER_HEIGHT + gridHeight)
      ctx.stroke()
    }

    // Draw notes
    for (const note of notes) {
      const x = PITCH_LABEL_WIDTH + note.step * CELL_WIDTH
      const y = HEADER_HEIGHT + (pitchCount - 1 - note.pitch) * CELL_HEIGHT

      ctx.fillStyle = note.accent ? '#ff00aa' : '#00d4ff'
      ctx.fillRect(x + 1, y + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2)

      // Draw note length indicator if > 1
      if (note.length > 1) {
        ctx.fillStyle = note.accent ? '#cc0088' : '#00a8cc'
        ctx.fillRect(
          x + CELL_WIDTH - 2,
          y + 1,
          (note.length - 1) * CELL_WIDTH,
          CELL_HEIGHT - 2
        )
      }
    }

    // Draw playhead
    if (currentStep >= 0 && isPlaying) {
      const x = PITCH_LABEL_WIDTH + currentStep * CELL_WIDTH
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'
      ctx.fillRect(x, HEADER_HEIGHT, CELL_WIDTH, gridHeight)

      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, HEADER_HEIGHT)
      ctx.lineTo(x, HEADER_HEIGHT + gridHeight)
      ctx.stroke()
    }
  }, [notes, scaleNotes, pitchCount, gridWidth, gridHeight, currentStep, isPlaying])

  return (
    <div
      ref={containerRef}
      className="w-full"
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  )
}
