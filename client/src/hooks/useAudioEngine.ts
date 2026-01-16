import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import type { Pattern, SynthType, FilterType, DelayTime } from '../types'
import { SCALES, scaleDegreeToMidi } from '../scales'

// Effect presets for each synth type
interface EffectPreset {
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

const SYNTH_PRESETS: Record<SynthType, EffectPreset> = {
  // Acid Dark - low filter, moody
  acidDark: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 800,
    filterQ: 6,
    delayEnabled: true,
    delayTime: '8n',
    delayFeedback: 0.45,
    delayMix: 0.35,
    reverbEnabled: true,
    reverbDecay: 2.5,
    reverbMix: 0.3
  },
  // Acid Dark Deep - very low filter, subby
  acidDarkDeep: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 500,
    filterQ: 8,
    delayEnabled: true,
    delayTime: '4n',
    delayFeedback: 0.5,
    delayMix: 0.3,
    reverbEnabled: true,
    reverbDecay: 3.5,
    reverbMix: 0.4
  },
  // Acid Dark Gritty - distorted character
  acidDarkGritty: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 1000,
    filterQ: 10,
    delayEnabled: true,
    delayTime: '16n',
    delayFeedback: 0.4,
    delayMix: 0.25,
    reverbEnabled: true,
    reverbDecay: 2.0,
    reverbMix: 0.25
  },
  // Acid Dark Hollow - bandpass for haunting sound
  acidDarkHollow: {
    filterEnabled: true,
    filterType: 'bandpass',
    filterFreq: 700,
    filterQ: 5,
    delayEnabled: true,
    delayTime: '8n.',
    delayFeedback: 0.55,
    delayMix: 0.4,
    reverbEnabled: true,
    reverbDecay: 4.0,
    reverbMix: 0.45
  },
  // Acid Dark Sub - deep sub bass character
  acidDarkSub: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 400,
    filterQ: 4,
    delayEnabled: true,
    delayTime: '4n',
    delayFeedback: 0.35,
    delayMix: 0.2,
    reverbEnabled: true,
    reverbDecay: 3.0,
    reverbMix: 0.35
  }
}

function createSynth(type: SynthType): Tone.PolySynth {
  switch (type) {
    case 'acidDark':
      // Dark acid - longer decay, moody
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.15 }
      })
    case 'acidDarkDeep':
      // Deep dark acid - very long decay, subby
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.4, sustain: 0.05, release: 0.25 }
      })
    case 'acidDarkGritty':
      // Gritty dark acid - slightly detuned for character
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', spread: 8, count: 2 },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.08, release: 0.12 }
      })
    case 'acidDarkHollow':
      // Hollow dark acid - triangle wave for haunting tone
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.002, decay: 0.35, sustain: 0.03, release: 0.2 }
      })
    case 'acidDarkSub':
      // Sub dark acid - sine-like deep bass
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.3 }
      })
    default:
      // Default to acidDark
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.15 }
      })
  }
}

// 909-style kick drum
function create909Kick(): Tone.MembraneSynth {
  return new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0.01,
      release: 0.4,
      attackCurve: 'exponential'
    }
  })
}

export function useAudioEngine(pattern: Pattern, tempo: number, loopStartStep: number, loopEndStep: number) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isLooping, setIsLooping] = useState(true)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [metronomeVolume, setMetronomeVolume] = useState(-12) // dB
  const [metronomeType, setMetronomeType] = useState<'click' | '909'>('click')
  const [synthType, setSynthType] = useState<SynthType>('acidDark')
  const [synthVolume, setSynthVolume] = useState(-6) // dB

  // Filter state
  const [filterEnabled, setFilterEnabled] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('lowpass')
  const [filterFreq, setFilterFreq] = useState(2000) // Hz
  const [filterQ, setFilterQ] = useState(1)

  // Delay state
  const [delayEnabled, setDelayEnabled] = useState(false)
  const [delayTime, setDelayTime] = useState<DelayTime>('8n')
  const [delayFeedback, setDelayFeedback] = useState(0.3)
  const [delayMix, setDelayMix] = useState(0.3)

  // Reverb state
  const [reverbEnabled, setReverbEnabled] = useState(false)
  const [reverbDecay, setReverbDecay] = useState(2.5)
  const [reverbMix, setReverbMix] = useState(0.3)

  const synthRef = useRef<Tone.PolySynth | Tone.PluckSynth | Tone.FMSynth | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const delayRef = useRef<Tone.FeedbackDelay | null>(null)
  const delayGainRef = useRef<Tone.Gain | null>(null)
  const dryGainRef = useRef<Tone.Gain | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const metronomeRef = useRef<Tone.MembraneSynth | null>(null)
  const kick909Ref = useRef<Tone.MembraneSynth | null>(null)
  const sequenceRef = useRef<Tone.Sequence | null>(null)
  const patternRef = useRef(pattern)

  // Keep pattern ref updated
  useEffect(() => {
    patternRef.current = pattern
  }, [pattern])

  // Initialize effects chain
  useEffect(() => {
    // Create filter
    filterRef.current = new Tone.Filter({
      type: filterType,
      frequency: filterFreq,
      Q: filterQ
    })

    // Create delay with wet/dry mix
    delayRef.current = new Tone.FeedbackDelay({
      delayTime: delayTime,
      feedback: delayFeedback,
      wet: 1
    })
    delayGainRef.current = new Tone.Gain(delayMix)
    dryGainRef.current = new Tone.Gain(1)

    // Create reverb
    reverbRef.current = new Tone.Reverb({
      decay: reverbDecay,
      wet: reverbMix
    })

    return () => {
      filterRef.current?.dispose()
      delayRef.current?.dispose()
      delayGainRef.current?.dispose()
      dryGainRef.current?.dispose()
      reverbRef.current?.dispose()
    }
  }, [])

  // Update filter parameters
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.type = filterType
      filterRef.current.frequency.value = filterFreq
      filterRef.current.Q.value = filterQ
    }
  }, [filterType, filterFreq, filterQ])

  // Update delay parameters
  useEffect(() => {
    if (delayRef.current) {
      delayRef.current.delayTime.value = delayTime
      delayRef.current.feedback.value = delayFeedback
    }
    if (delayGainRef.current) {
      delayGainRef.current.gain.value = delayMix
    }
  }, [delayTime, delayFeedback, delayMix])

  // Update reverb parameters
  useEffect(() => {
    if (reverbRef.current) {
      reverbRef.current.decay = reverbDecay
      reverbRef.current.wet.value = reverbMix
    }
  }, [reverbDecay, reverbMix])

  // Initialize/update synth and routing when type or effects change
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.dispose()
    }

    synthRef.current = createSynth(synthType)
    synthRef.current.volume.value = synthVolume

    // Build signal chain based on enabled effects
    // Synth -> [Filter] -> [Reverb] -> [Delay mix] -> Destination
    let currentNode: Tone.ToneAudioNode = synthRef.current

    if (filterEnabled && filterRef.current) {
      currentNode.connect(filterRef.current)
      currentNode = filterRef.current
    }

    if (reverbEnabled && reverbRef.current) {
      currentNode.connect(reverbRef.current)
      currentNode = reverbRef.current
    }

    if (delayEnabled && delayRef.current && delayGainRef.current && dryGainRef.current) {
      // Parallel dry/wet routing for delay
      currentNode.connect(dryGainRef.current)
      currentNode.connect(delayRef.current)
      delayRef.current.connect(delayGainRef.current)
      dryGainRef.current.toDestination()
      delayGainRef.current.toDestination()
    } else {
      currentNode.toDestination()
    }

    return () => {
      synthRef.current?.dispose()
    }
  }, [synthType, filterEnabled, reverbEnabled, delayEnabled])

  // Update synth volume
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = synthVolume
    }
  }, [synthVolume])

  // Initialize metronome sounds
  useEffect(() => {
    // Click metronome
    metronomeRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).toDestination()

    // 909 kick metronome
    kick909Ref.current = create909Kick()
    kick909Ref.current.toDestination()

    return () => {
      metronomeRef.current?.dispose()
      kick909Ref.current?.dispose()
    }
  }, [])

  // Update metronome volume
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeVolume
    }
    if (kick909Ref.current) {
      kick909Ref.current.volume.value = metronomeVolume
    }
  }, [metronomeVolume])

  // Update tempo
  useEffect(() => {
    Tone.getTransport().bpm.value = tempo
  }, [tempo])

  // Create/update sequence
  useEffect(() => {
    if (sequenceRef.current) {
      sequenceRef.current.dispose()
    }

    // Create steps array for the loop range only
    const loopLength = loopEndStep - loopStartStep
    const steps = Array.from({ length: loopLength }, (_, i) => loopStartStep + i)

    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step)

        const currentPattern = patternRef.current
        const scaleData = SCALES[currentPattern.scale]

        // Find notes at this step
        const notesAtStep = currentPattern.notes.filter(n => n.step === step)

        // Play notes
        notesAtStep.forEach(note => {
          const midiNote = scaleDegreeToMidi(note.pitch, scaleData, currentPattern.rootNote)
          const freq = Tone.Frequency(midiNote, 'midi').toFrequency()
          const duration = `${note.length * 16}n`
          const velocity = note.velocity / 127

          if (synthRef.current && 'triggerAttackRelease' in synthRef.current) {
            synthRef.current.triggerAttackRelease(freq, duration, time, velocity)
          }
        })

        // Metronome on beats (every 4 steps)
        if (metronomeEnabled && step % 4 === 0) {
          const isDownbeat = (step - loopStartStep) % 16 === 0
          if (metronomeType === '909') {
            // 909 kick - play on every beat, accent on downbeat
            kick909Ref.current?.triggerAttackRelease(
              'C1',
              '8n',
              time,
              isDownbeat ? 1 : 0.7
            )
          } else {
            // Click metronome
            metronomeRef.current?.triggerAttackRelease(
              isDownbeat ? 'C2' : 'C3',
              '32n',
              time
            )
          }
        }

        // Handle non-looping playback
        if (step === loopEndStep - 1 && !isLooping) {
          Tone.getTransport().stop()
          setIsPlaying(false)
          setCurrentStep(-1)
        }
      },
      steps,
      '16n'
    )

    if (isPlaying) {
      sequenceRef.current.start(0)
    }

    return () => {
      sequenceRef.current?.dispose()
    }
  }, [isLooping, metronomeEnabled, metronomeType, loopStartStep, loopEndStep])

  const play = useCallback(async () => {
    await Tone.start()
    Tone.getTransport().bpm.value = tempo
    sequenceRef.current?.start(0)
    Tone.getTransport().start()
    setIsPlaying(true)
  }, [tempo])

  const stop = useCallback(() => {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    sequenceRef.current?.stop()
    setIsPlaying(false)
    setCurrentStep(-1)
  }, [])

  // Apply synth type with its effect preset
  const applyPreset = useCallback((type: SynthType) => {
    const preset = SYNTH_PRESETS[type]
    setSynthType(type)
    setFilterEnabled(preset.filterEnabled)
    setFilterType(preset.filterType)
    setFilterFreq(preset.filterFreq)
    setFilterQ(preset.filterQ)
    setDelayEnabled(preset.delayEnabled)
    setDelayTime(preset.delayTime)
    setDelayFeedback(preset.delayFeedback)
    setDelayMix(preset.delayMix)
    setReverbEnabled(preset.reverbEnabled)
    setReverbDecay(preset.reverbDecay)
    setReverbMix(preset.reverbMix)
  }, [])

  // Auto filter sweep state
  const [filterSweepActive, setFilterSweepActive] = useState(false)
  const filterSweepTimeoutRef = useRef<number | null>(null)

  // Trigger filter sweep over 16 bars (up 8 bars, down 8 bars)
  const triggerFilterSweep = useCallback(() => {
    if (!filterRef.current) return

    // Enable filter if not already
    if (!filterEnabled) {
      setFilterEnabled(true)
    }

    // Set to lowpass for sweep
    setFilterType('lowpass')

    const lowFreq = 200
    const highFreq = 8000

    filterRef.current.frequency.value = lowFreq
    setFilterFreq(lowFreq)
    setFilterSweepActive(true)

    // Calculate sweep duration: 8 bars each direction
    // 8 bars = 32 beats, duration = 32 beats * (60 / tempo) seconds
    const halfDuration = 32 * (60 / tempo)

    // Ramp up over 8 bars
    filterRef.current.frequency.rampTo(highFreq, halfDuration)

    // Schedule ramp down after 8 bars
    const now = Tone.now()
    filterRef.current.frequency.rampTo(lowFreq, halfDuration, now + halfDuration)

    // Update the UI state periodically during sweep
    const updateInterval = 50 // ms
    const totalDuration = halfDuration * 2
    const totalSteps = Math.floor(totalDuration * 1000 / updateInterval)
    const halfSteps = totalSteps / 2
    let currentStep = 0

    const updateUI = () => {
      currentStep++
      let newFreq: number

      if (currentStep <= halfSteps) {
        // Sweeping up
        const progress = currentStep / halfSteps
        newFreq = lowFreq + (highFreq - lowFreq) * progress
      } else {
        // Sweeping down
        const progress = (currentStep - halfSteps) / halfSteps
        newFreq = highFreq - (highFreq - lowFreq) * progress
      }

      setFilterFreq(Math.round(newFreq))

      if (currentStep < totalSteps) {
        filterSweepTimeoutRef.current = window.setTimeout(updateUI, updateInterval)
      } else {
        setFilterSweepActive(false)
      }
    }

    // Clear any existing timeout
    if (filterSweepTimeoutRef.current) {
      window.clearTimeout(filterSweepTimeoutRef.current)
    }

    filterSweepTimeoutRef.current = window.setTimeout(updateUI, updateInterval)
  }, [filterEnabled, tempo])

  // Cleanup sweep timeout on unmount
  useEffect(() => {
    return () => {
      if (filterSweepTimeoutRef.current) {
        window.clearTimeout(filterSweepTimeoutRef.current)
      }
    }
  }, [])

  return {
    isPlaying,
    currentStep,
    play,
    stop,
    isLooping,
    setIsLooping,
    metronomeEnabled,
    setMetronomeEnabled,
    metronomeVolume,
    setMetronomeVolume,
    metronomeType,
    setMetronomeType,
    synthType,
    setSynthType,
    synthVolume,
    setSynthVolume,
    applyPreset,
    // Filter
    filterEnabled,
    setFilterEnabled,
    filterType,
    setFilterType,
    filterFreq,
    setFilterFreq,
    filterQ,
    setFilterQ,
    // Delay
    delayEnabled,
    setDelayEnabled,
    delayTime,
    setDelayTime,
    delayFeedback,
    setDelayFeedback,
    delayMix,
    setDelayMix,
    // Reverb
    reverbEnabled,
    setReverbEnabled,
    reverbDecay,
    setReverbDecay,
    reverbMix,
    setReverbMix,
    // Filter sweep
    filterSweepActive,
    triggerFilterSweep
  }
}
