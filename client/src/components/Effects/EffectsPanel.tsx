import { Timer, Waves, Sparkles } from 'lucide-react'
import { FILTER_TYPES, DELAY_TIMES, type FilterType, type DelayTime } from '../../types'
import { useTooltip } from '../Tooltip/TooltipBar'

interface EffectsPanelProps {
  // Filter
  filterEnabled: boolean
  onFilterEnabledChange: (enabled: boolean) => void
  filterType: FilterType
  onFilterTypeChange: (type: FilterType) => void
  filterFreq: number
  onFilterFreqChange: (freq: number) => void
  filterQ: number
  onFilterQChange: (q: number) => void
  // Delay
  delayEnabled: boolean
  onDelayEnabledChange: (enabled: boolean) => void
  delayTime: DelayTime
  onDelayTimeChange: (time: DelayTime) => void
  delayFeedback: number
  onDelayFeedbackChange: (feedback: number) => void
  delayMix: number
  onDelayMixChange: (mix: number) => void
  // Reverb
  reverbEnabled: boolean
  onReverbEnabledChange: (enabled: boolean) => void
  reverbDecay: number
  onReverbDecayChange: (decay: number) => void
  reverbMix: number
  onReverbMixChange: (mix: number) => void
}

function formatFreq(freq: number): string {
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`
  }
  return `${freq}`
}

export function EffectsPanel({
  filterEnabled,
  onFilterEnabledChange,
  filterType,
  onFilterTypeChange,
  filterFreq,
  onFilterFreqChange,
  filterQ,
  onFilterQChange,
  delayEnabled,
  onDelayEnabledChange,
  delayTime,
  onDelayTimeChange,
  delayFeedback,
  onDelayFeedbackChange,
  delayMix,
  onDelayMixChange,
  reverbEnabled,
  onReverbEnabledChange,
  reverbDecay,
  onReverbDecayChange,
  reverbMix,
  onReverbMixChange
}: EffectsPanelProps) {
  const { setTooltip } = useTooltip()

  const tip = (text: string) => ({
    onMouseEnter: () => setTooltip(text),
    onMouseLeave: () => setTooltip('')
  })

  return (
    <div className="flex items-center gap-6">
      {/* Filter Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onFilterEnabledChange(!filterEnabled)}
          {...tip(filterEnabled ? 'Disable filter effect' : 'Enable filter effect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterEnabled
              ? 'bg-note-active text-grid-bg'
              : 'bg-grid-line text-gray-400 hover:bg-grid-bar'
          }`}
        >
          <Waves className="w-4 h-4" />
          Filter
        </button>

        {filterEnabled && (
          <>
            <select
              value={filterType}
              onChange={e => onFilterTypeChange(e.target.value as FilterType)}
              {...tip('Select filter type')}
              className="px-2 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-sm font-medium"
            >
              {FILTER_TYPES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-grid-line/50 px-3 py-1.5 rounded-lg" {...tip('Filter cutoff frequency')}>
              <span className="text-xs text-gray-500">Cutoff</span>
              <input
                type="range"
                min={100}
                max={8000}
                value={filterFreq}
                onChange={e => onFilterFreqChange(parseInt(e.target.value))}
                className="w-20 accent-note-active"
              />
              <span className="text-xs font-medium w-10">{formatFreq(filterFreq)}</span>
            </div>

            <div className="flex items-center gap-2 bg-grid-line/50 px-3 py-1.5 rounded-lg" {...tip('Filter resonance/Q')}>
              <span className="text-xs text-gray-500">Res</span>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={filterQ}
                onChange={e => onFilterQChange(parseFloat(e.target.value))}
                className="w-16 accent-note-active"
              />
              <span className="text-xs font-medium w-6">{filterQ}</span>
            </div>
          </>
        )}
      </div>

      <div className="w-px h-8 bg-grid-line" />

      {/* Delay Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onDelayEnabledChange(!delayEnabled)}
          {...tip(delayEnabled ? 'Disable echo/delay effect' : 'Enable echo/delay effect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            delayEnabled
              ? 'bg-note-active text-grid-bg'
              : 'bg-grid-line text-gray-400 hover:bg-grid-bar'
          }`}
        >
          <Timer className="w-4 h-4" />
          Echo
        </button>

        {delayEnabled && (
          <>
            <select
              value={delayTime}
              onChange={e => onDelayTimeChange(e.target.value as DelayTime)}
              {...tip('Select delay time (synced to tempo)')}
              className="px-2 py-1.5 bg-grid-line border border-grid-bar rounded-lg text-sm font-medium"
            >
              {DELAY_TIMES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-grid-line/50 px-3 py-1.5 rounded-lg" {...tip('Echo feedback/repeat amount')}>
              <span className="text-xs text-gray-500">Repeat</span>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={delayFeedback}
                onChange={e => onDelayFeedbackChange(parseFloat(e.target.value))}
                className="w-16 accent-note-active"
              />
              <span className="text-xs font-medium w-8">{Math.round(delayFeedback * 100)}%</span>
            </div>

            <div className="flex items-center gap-2 bg-grid-line/50 px-3 py-1.5 rounded-lg" {...tip('Dry/wet mix for echo effect')}>
              <span className="text-xs text-gray-500">Mix</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={delayMix}
                onChange={e => onDelayMixChange(parseFloat(e.target.value))}
                className="w-16 accent-note-active"
              />
              <span className="text-xs font-medium w-8">{Math.round(delayMix * 100)}%</span>
            </div>
          </>
        )}
      </div>

      <div className="w-px h-8 bg-grid-line" />

      {/* Reverb Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onReverbEnabledChange(!reverbEnabled)}
          {...tip(reverbEnabled ? 'Disable reverb effect' : 'Enable reverb effect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            reverbEnabled
              ? 'bg-note-active text-grid-bg'
              : 'bg-grid-line text-gray-400 hover:bg-grid-bar'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Reverb
        </button>

        {reverbEnabled && (
          <>
            <div className="flex items-center gap-2 bg-grid-line/50 px-3 py-1.5 rounded-lg" {...tip('Reverb decay time (room size)')}>
              <span className="text-xs text-gray-500">Decay</span>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={reverbDecay}
                onChange={e => onReverbDecayChange(parseFloat(e.target.value))}
                className="w-16 accent-note-active"
              />
              <span className="text-xs font-medium w-8">{reverbDecay}s</span>
            </div>

            <div className="flex items-center gap-2 bg-grid-line/50 px-3 py-1.5 rounded-lg" {...tip('Dry/wet mix for reverb effect')}>
              <span className="text-xs text-gray-500">Mix</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={reverbMix}
                onChange={e => onReverbMixChange(parseFloat(e.target.value))}
                className="w-16 accent-note-active"
              />
              <span className="text-xs font-medium w-8">{Math.round(reverbMix * 100)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
