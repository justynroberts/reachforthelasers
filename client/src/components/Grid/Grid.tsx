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
  theme?: string // Theme for redraw trigger
  loopStartStep?: number // Loop start position in steps
  loopEndStep?: number // Loop end position in steps
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
  theme,
  loopStartStep = 0,
  loopEndStep = 64,
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

    // Read theme colors from CSS variables
    const styles = getComputedStyle(document.documentElement)
    const bgPrimary = styles.getPropertyValue('--bg-primary').trim() || '#0a0a0f'
    const bgSecondary = styles.getPropertyValue('--bg-secondary').trim() || '#1a1a2e'
    const bgTertiary = styles.getPropertyValue('--bg-tertiary').trim() || '#2d2d44'
    const textMuted = styles.getPropertyValue('--text-muted').trim() || '#6b7280'
    const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#9ca3af'
    const noteActive = styles.getPropertyValue('--note-active').trim() || '#00d4ff'
    const noteAccent = styles.getPropertyValue('--note-accent').trim() || '#ff00aa'
    const playheadColor = styles.getPropertyValue('--playhead').trim() || '#ffff00'

    const dpr = window.devicePixelRatio || 1
    canvas.width = (gridWidth + PITCH_LABEL_WIDTH) * dpr
    canvas.height = (gridHeight + HEADER_HEIGHT) * dpr
    canvas.style.width = `${gridWidth + PITCH_LABEL_WIDTH}px`
    canvas.style.height = `${gridHeight + HEADER_HEIGHT}px`
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = bgPrimary
    ctx.fillRect(0, 0, gridWidth + PITCH_LABEL_WIDTH, gridHeight + HEADER_HEIGHT)

    // Draw pitch labels
    ctx.fillStyle = textMuted
    ctx.font = '11px Outfit, sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < pitchCount; i++) {
      const y = HEADER_HEIGHT + (pitchCount - 1 - i) * CELL_HEIGHT + CELL_HEIGHT / 2
      const midiNote = scaleNotes[i]
      ctx.fillText(midiToNoteName(midiNote), PITCH_LABEL_WIDTH - 8, y)
    }

    // Draw loop indicator in header
    const loopStartX = PITCH_LABEL_WIDTH + loopStartStep * CELL_WIDTH
    const loopEndX = PITCH_LABEL_WIDTH + loopEndStep * CELL_WIDTH
    const loopIndicatorHeight = 6
    const loopIndicatorY = 4

    // Loop region background
    ctx.fillStyle = noteActive
    ctx.globalAlpha = 0.3
    ctx.fillRect(loopStartX, loopIndicatorY, loopEndX - loopStartX, loopIndicatorHeight)
    ctx.globalAlpha = 1

    // Loop region border
    ctx.strokeStyle = noteActive
    ctx.lineWidth = 2
    ctx.strokeRect(loopStartX, loopIndicatorY, loopEndX - loopStartX, loopIndicatorHeight)

    // Loop start/end markers (small triangles)
    ctx.fillStyle = noteActive
    // Start marker
    ctx.beginPath()
    ctx.moveTo(loopStartX, loopIndicatorY + loopIndicatorHeight + 2)
    ctx.lineTo(loopStartX + 5, loopIndicatorY + loopIndicatorHeight + 6)
    ctx.lineTo(loopStartX - 5, loopIndicatorY + loopIndicatorHeight + 6)
    ctx.closePath()
    ctx.fill()
    // End marker
    ctx.beginPath()
    ctx.moveTo(loopEndX, loopIndicatorY + loopIndicatorHeight + 2)
    ctx.lineTo(loopEndX + 5, loopIndicatorY + loopIndicatorHeight + 6)
    ctx.lineTo(loopEndX - 5, loopIndicatorY + loopIndicatorHeight + 6)
    ctx.closePath()
    ctx.fill()

    // Draw bar numbers in header
    ctx.fillStyle = textSecondary
    ctx.textAlign = 'center'
    for (let bar = 0; bar < 16; bar++) {
      const x = PITCH_LABEL_WIDTH + bar * STEPS_PER_BAR * CELL_WIDTH + (STEPS_PER_BAR * CELL_WIDTH) / 2
      ctx.fillText(`${bar + 1}`, x, HEADER_HEIGHT - 6)
    }

    // Draw grid lines
    ctx.strokeStyle = bgSecondary
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

      ctx.strokeStyle = isBar ? textMuted : isBeat ? bgTertiary : bgSecondary
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

      ctx.fillStyle = note.accent ? noteAccent : noteActive
      ctx.fillRect(x + 1, y + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2)

      // Draw note length indicator if > 1
      if (note.length > 1) {
        ctx.globalAlpha = 0.7
        ctx.fillRect(
          x + CELL_WIDTH - 2,
          y + 1,
          (note.length - 1) * CELL_WIDTH,
          CELL_HEIGHT - 2
        )
        ctx.globalAlpha = 1
      }
    }

    // Draw playhead
    if (currentStep >= 0 && isPlaying) {
      const x = PITCH_LABEL_WIDTH + currentStep * CELL_WIDTH
      ctx.fillStyle = playheadColor
      ctx.globalAlpha = 0.3
      ctx.fillRect(x, HEADER_HEIGHT, CELL_WIDTH, gridHeight)
      ctx.globalAlpha = 1

      ctx.strokeStyle = playheadColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, HEADER_HEIGHT)
      ctx.lineTo(x, HEADER_HEIGHT + gridHeight)
      ctx.stroke()
    }
  }, [notes, scaleNotes, pitchCount, gridWidth, gridHeight, currentStep, isPlaying, theme, loopStartStep, loopEndStep])

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
