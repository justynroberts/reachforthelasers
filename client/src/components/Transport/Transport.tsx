import { Play, Square, Repeat, Clock, Volume2 } from 'lucide-react'
import { MIN_TEMPO, MAX_TEMPO, SYNTH_TYPES, type SynthType } from '../../types'

interface TransportProps {
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  tempo: number
  onTempoChange: (tempo: number) => void
  isLooping: boolean
  onLoopChange: (looping: boolean) => void
  metronomeEnabled: boolean
  onMetronomeChange: (enabled: boolean) => void
  metronomeVolume: number
  onMetronomeVolumeChange: (volume: number) => void
  synthType: SynthType
  onSynthTypeChange: (type: SynthType) => void
}

export function Transport({
  isPlaying,
  onPlay,
  onStop,
  tempo,
  onTempoChange,
  isLooping,
  onLoopChange,
  metronomeEnabled,
  onMetronomeChange,
  metronomeVolume,
  onMetronomeVolumeChange,
  synthType,
  onSynthTypeChange,
}: TransportProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isPlaying
            ? 'bg-red-500 hover:bg-red-600 hover:scale-105'
            : 'bg-note-active hover:opacity-90 hover:scale-105'
        }`}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <Square className="w-5 h-5 text-white" fill="white" />
        ) : (
          <Play className="w-5 h-5 text-grid-bg ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Tempo */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-400">Tempo</span>
        <input
          type="number"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={tempo}
          onChange={e => onTempoChange(Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, parseInt(e.target.value) || MIN_TEMPO)))}
          className="w-16 px-2 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-center text-sm font-medium"
        />
        <input
          type="range"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={tempo}
          onChange={e => onTempoChange(parseInt(e.target.value))}
          className="w-24 accent-note-active"
        />
      </div>

      {/* Loop Toggle */}
      <button
        onClick={() => onLoopChange(!isLooping)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isLooping
            ? 'bg-note-active text-grid-bg'
            : 'bg-grid-line text-gray-400 hover:bg-grid-bar'
        }`}
        aria-label="Toggle loop"
      >
        <Repeat className="w-4 h-4" />
        Loop
      </button>

      {/* Metronome */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onMetronomeChange(!metronomeEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            metronomeEnabled
              ? 'bg-note-active text-grid-bg'
              : 'bg-grid-line text-gray-400 hover:bg-grid-bar'
          }`}
          aria-label="Toggle metronome"
        >
          <Clock className="w-4 h-4" />
          Click
        </button>
        {metronomeEnabled && (
          <div className="flex items-center gap-1">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min={-24}
              max={0}
              value={metronomeVolume}
              onChange={e => onMetronomeVolumeChange(parseInt(e.target.value))}
              className="w-16 accent-note-active"
              aria-label="Metronome volume"
            />
          </div>
        )}
      </div>

      {/* Synth Type */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-400">Sound</span>
        <select
          value={synthType}
          onChange={e => onSynthTypeChange(e.target.value as SynthType)}
          className="px-3 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-sm font-medium cursor-pointer"
        >
          {SYNTH_TYPES.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
