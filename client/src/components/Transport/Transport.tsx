import { Play, Square, Repeat, Clock, Volume2, Disc } from 'lucide-react'
import { MIN_TEMPO, MAX_TEMPO, SYNTH_TYPES, type SynthType } from '../../types'
import { useTooltip } from '../Tooltip/TooltipBar'

type MetronomeType = 'click' | '909'

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
  metronomeType: MetronomeType
  onMetronomeTypeChange: (type: MetronomeType) => void
  synthType: SynthType
  onSynthTypeChange: (type: SynthType) => void
  synthVolume: number
  onSynthVolumeChange: (volume: number) => void
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
  metronomeType,
  onMetronomeTypeChange,
  synthType,
  onSynthTypeChange,
  synthVolume,
  onSynthVolumeChange,
}: TransportProps) {
  const { setTooltip } = useTooltip()

  const tip = (text: string) => ({
    onMouseEnter: () => setTooltip(text),
    onMouseLeave: () => setTooltip('')
  })

  return (
    <div className="flex items-center gap-4">
      {/* Play/Stop - Fairlight style */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        {...tip(isPlaying ? 'Stop playback (F1)' : 'Start playback (F1)')}
        className={`flex items-center gap-2 px-4 py-2 rounded border-2 transition-all font-mono text-sm ${
          isPlaying
            ? 'bg-grid-bg border-red-500 text-red-500 hover:bg-red-500/10'
            : 'bg-grid-bg border-note-active text-note-active hover:bg-note-active/10'
        }`}
        style={{
          boxShadow: isPlaying
            ? '0 0 10px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.1)'
            : '0 0 10px rgba(51, 255, 51, 0.5), inset 0 0 20px rgba(51, 255, 51, 0.1)'
        }}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <>
            <Square className="w-4 h-4" fill="currentColor" />
            <span>STOP</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" fill="currentColor" />
            <span>PLAY</span>
          </>
        )}
      </button>

      {/* Tempo */}
      <div className="flex items-center gap-2" {...tip('Adjust playback speed (BPM)')}>
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
        {...tip(isLooping ? 'Disable looping' : 'Enable looping within selected bars')}
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
        <div className="flex bg-grid-line rounded-lg p-0.5">
          <button
            onClick={() => {
              onMetronomeChange(true)
              onMetronomeTypeChange('click')
            }}
            {...tip('Enable click metronome')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
              metronomeEnabled && metronomeType === 'click'
                ? 'bg-note-active text-grid-bg'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label="Click metronome"
          >
            <Clock className="w-3.5 h-3.5" />
            Click
          </button>
          <button
            onClick={() => {
              onMetronomeChange(true)
              onMetronomeTypeChange('909')
            }}
            {...tip('Enable 909 kick metronome')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
              metronomeEnabled && metronomeType === '909'
                ? 'bg-note-active text-grid-bg'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label="909 kick metronome"
          >
            <Disc className="w-3.5 h-3.5" />
            909
          </button>
          {metronomeEnabled && (
            <button
              onClick={() => onMetronomeChange(false)}
              {...tip('Turn off metronome')}
              className="px-2 py-1 text-gray-500 hover:text-white text-sm"
              aria-label="Turn off metronome"
            >
              Off
            </button>
          )}
        </div>
        {metronomeEnabled && (
          <div className="flex items-center gap-1" {...tip('Adjust metronome volume')}>
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

      {/* Synth Type + Volume */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-400" {...tip('Choose synthesizer sound')}>Sound</span>
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
        <div className="flex items-center gap-1" {...tip('Adjust synth volume')}>
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min={-24}
            max={0}
            value={synthVolume}
            onChange={e => onSynthVolumeChange(parseInt(e.target.value))}
            className="w-16 accent-note-active"
            aria-label="Synth volume"
          />
        </div>
      </div>
    </div>
  )
}
