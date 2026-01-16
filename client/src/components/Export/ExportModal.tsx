import { useState } from 'react'
import { Midi } from '@tonejs/midi'
import type { Pattern, ScaleType, SynthType, FilterType, DelayTime } from '../../types'
import { NOTE_NAMES } from '../../types'
import { SCALES, scaleDegreeToMidi } from '../../scales'

export interface SoundSettings {
  synthType: SynthType
  filterEnabled: boolean
  filterType: FilterType
  filterFreq: number
  filterQ: number
  delayEnabled: boolean
  delayTime: DelayTime
  delayFeedback: number
  delayMix: number
  reverbEnabled: boolean
  reverbDecay: number
  reverbMix: number
}

interface ExportModalProps {
  pattern: Pattern
  scale: ScaleType
  rootNote: number
  tempo: number
  soundSettings: SoundSettings
  onClose: () => void
}

type VelocityCurve = 'as-is' | 'compress' | 'expand' | 'humanize'
type NoteLengthOption = 'as-programmed' | 'legato' | 'staccato'

const CATALOG_STORAGE_KEY = 'reach-for-lasers-user-patterns'

export interface SavedPattern {
  id: string
  name: string
  notes: Pattern['notes']
  scale: ScaleType
  rootNote: number
  tempo: number
  soundSettings?: SoundSettings
  createdAt: string
}

function savePatternToCatalog(pattern: SavedPattern) {
  const existing = localStorage.getItem(CATALOG_STORAGE_KEY)
  const patterns: SavedPattern[] = existing ? JSON.parse(existing) : []
  patterns.unshift(pattern)
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(patterns))
}

export function ExportModal({
  pattern,
  scale,
  rootNote,
  tempo,
  soundSettings,
  onClose
}: ExportModalProps) {
  const [channel, setChannel] = useState(1)
  const [velocityCurve, setVelocityCurve] = useState<VelocityCurve>('as-is')
  const [includeTempo, setIncludeTempo] = useState(true)
  const [noteLength, setNoteLength] = useState<NoteLengthOption>('as-programmed')
  const [saveToCatalog, setSaveToCatalog] = useState(true)
  const [patternName, setPatternName] = useState('')

  const handleExport = () => {
    const midi = new Midi()
    midi.header.setTempo(tempo)

    const track = midi.addTrack()
    track.channel = channel - 1 // 0-indexed

    const scaleData = SCALES[scale]
    const secondsPerBeat = 60 / tempo
    const secondsPer16th = secondsPerBeat / 4

    for (const note of pattern.notes) {
      const midiNote = scaleDegreeToMidi(note.pitch, scaleData, rootNote)

      // Calculate velocity based on curve
      let velocity = note.velocity / 127
      switch (velocityCurve) {
        case 'compress':
          velocity = 0.5 + velocity * 0.3
          break
        case 'expand':
          velocity = Math.pow(velocity, 1.5)
          break
        case 'humanize':
          velocity = velocity * (0.9 + Math.random() * 0.2)
          break
      }
      velocity = Math.max(0, Math.min(1, velocity))

      // Calculate duration
      let durationSteps = note.length
      switch (noteLength) {
        case 'legato':
          durationSteps = note.length * 1.1
          break
        case 'staccato':
          durationSteps = note.length * 0.5
          break
      }

      const startTime = note.step * secondsPer16th
      const duration = durationSteps * secondsPer16th

      track.addNote({
        midi: midiNote,
        time: startTime,
        duration,
        velocity
      })
    }

    // Generate filename
    const scaleName = SCALES[scale].name.replace(/[^a-zA-Z]/g, '')
    const filename = `pattern_${scaleName}_${tempo}bpm.mid`

    // Download
    const blob = new Blob([midi.toArray()], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    // Save to catalog if enabled
    if (saveToCatalog && patternName.trim()) {
      savePatternToCatalog({
        id: `user-${Date.now()}`,
        name: patternName.trim(),
        notes: pattern.notes,
        scale,
        rootNote,
        tempo,
        soundSettings,
        createdAt: new Date().toISOString()
      })
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-grid-bg border border-grid-line rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-grid-line">
          <h2 className="text-lg font-medium">Export MIDI</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Channel */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              MIDI Channel
            </label>
            <select
              value={channel}
              onChange={e => setChannel(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-grid-line border border-grid-bar rounded"
            >
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Channel {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Velocity Curve */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Velocity Curve
            </label>
            <select
              value={velocityCurve}
              onChange={e => setVelocityCurve(e.target.value as VelocityCurve)}
              className="w-full px-3 py-2 bg-grid-line border border-grid-bar rounded"
            >
              <option value="as-is">As Programmed</option>
              <option value="compress">Compress (more even)</option>
              <option value="expand">Expand (more dynamic)</option>
              <option value="humanize">Humanize (slight randomization)</option>
            </select>
          </div>

          {/* Note Length */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Note Length
            </label>
            <select
              value={noteLength}
              onChange={e => setNoteLength(e.target.value as NoteLengthOption)}
              className="w-full px-3 py-2 bg-grid-line border border-grid-bar rounded"
            >
              <option value="as-programmed">As Programmed</option>
              <option value="legato">Legato (overlapping)</option>
              <option value="staccato">Staccato (short)</option>
            </select>
          </div>

          {/* Include Tempo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeTempo"
              checked={includeTempo}
              onChange={e => setIncludeTempo(e.target.checked)}
              className="rounded border-grid-bar bg-grid-line"
            />
            <label htmlFor="includeTempo" className="text-sm text-gray-400">
              Include tempo marker ({tempo} BPM)
            </label>
          </div>

          {/* Save to Catalog */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveToCatalog"
                checked={saveToCatalog}
                onChange={e => setSaveToCatalog(e.target.checked)}
                className="rounded border-grid-bar bg-grid-line"
              />
              <label htmlFor="saveToCatalog" className="text-sm text-gray-400">
                Save to catalog
              </label>
            </div>
            {saveToCatalog && (
              <input
                type="text"
                value={patternName}
                onChange={e => setPatternName(e.target.value)}
                placeholder="Pattern name..."
                className="w-full px-3 py-2 bg-grid-line border border-grid-bar rounded text-sm"
              />
            )}
          </div>

          {/* Preview info */}
          <div className="bg-grid-line rounded p-3 text-sm text-gray-400">
            <div className="flex justify-between mb-1">
              <span>Notes:</span>
              <span>{pattern.notes.length}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Scale:</span>
              <span>{SCALES[scale].name}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Key:</span>
              <span>{NOTE_NAMES[rootNote % 12]}{Math.floor(rootNote / 12) - 1}</span>
            </div>
            <div className="flex justify-between">
              <span>Tempo:</span>
              <span>{tempo} BPM</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-grid-line">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-grid-line text-gray-300 rounded hover:bg-grid-bar"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={pattern.notes.length === 0}
            className="px-4 py-2 bg-note-active text-grid-bg rounded hover:opacity-90 disabled:opacity-50"
          >
            Download MIDI
          </button>
        </div>
      </div>
    </div>
  )
}
