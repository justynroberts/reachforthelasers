import { Music2 } from 'lucide-react'
import type { ScaleType } from '../../types'
import { NOTE_NAMES } from '../../types'
import { SCALES } from '../../scales'
import { useTooltip } from '../Tooltip/TooltipBar'

interface ScaleSelectorProps {
  scale: ScaleType
  onScaleChange: (scale: ScaleType) => void
  rootNote: number
  onRootNoteChange: (rootNote: number) => void
}

const SCALE_OPTIONS: ScaleType[] = [
  'chromatic',
  'major',
  'minor',
  'harmonicMinor',
  'melodicMinor',
  'dorian',
  'phrygian',
  'phrygianDominant',
  'lydian',
  'mixolydian',
  'wholeTone',
  'diminished',
  'pentatonicMajor',
  'pentatonicMinor',
  'blues'
]

export function ScaleSelector({
  scale,
  onScaleChange,
  rootNote,
  onRootNoteChange,
}: ScaleSelectorProps) {
  // Convert MIDI note to root (0-11) and octave
  const rootPitch = rootNote % 12
  const octave = Math.floor(rootNote / 12) - 1 // MIDI octave convention

  const handleRootChange = (newRoot: number) => {
    // Keep same octave, change root
    const newMidi = (octave + 1) * 12 + newRoot
    onRootNoteChange(newMidi)
  }

  const handleOctaveChange = (newOctave: number) => {
    const newMidi = (newOctave + 1) * 12 + rootPitch
    onRootNoteChange(newMidi)
  }

  const { setTooltip } = useTooltip()

  const tip = (text: string) => ({
    onMouseEnter: () => setTooltip(text),
    onMouseLeave: () => setTooltip('')
  })

  return (
    <div className="flex items-center gap-4">
      {/* Scale Selector */}
      <div className="flex items-center gap-2" {...tip('Select musical scale for the grid')}>
        <Music2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-400">Scale</span>
        <select
          value={scale}
          onChange={e => onScaleChange(e.target.value as ScaleType)}
          className="px-3 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-sm font-medium cursor-pointer"
        >
          {SCALE_OPTIONS.map(s => (
            <option key={s} value={s}>
              {SCALES[s].name}
            </option>
          ))}
        </select>
      </div>

      {/* Root Note Selector */}
      <div className="flex items-center gap-2" {...tip('Set root note (tonic) of the scale')}>
        <span className="text-sm font-medium text-gray-400">Key</span>
        <select
          value={rootPitch}
          onChange={e => handleRootChange(parseInt(e.target.value))}
          className="px-3 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-sm font-medium cursor-pointer"
        >
          {NOTE_NAMES.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Octave Selector */}
      <div className="flex items-center gap-2" {...tip('Set base octave for the pattern')}>
        <span className="text-sm font-medium text-gray-400">Octave</span>
        <select
          value={octave}
          onChange={e => handleOctaveChange(parseInt(e.target.value))}
          className="px-3 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-sm font-medium cursor-pointer"
        >
          {[1, 2, 3, 4, 5, 6].map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
