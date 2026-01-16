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
  // Saw - clean with subtle reverb
  saw: {
    filterEnabled: false,
    filterType: 'lowpass',
    filterFreq: 2000,
    filterQ: 1,
    delayEnabled: false,
    delayTime: '8n',
    delayFeedback: 0.3,
    delayMix: 0.3,
    reverbEnabled: true,
    reverbDecay: 2.0,
    reverbMix: 0.2
  },
  // Supersaw - big reverb, slight delay
  supersaw: {
    filterEnabled: false,
    filterType: 'lowpass',
    filterFreq: 3000,
    filterQ: 1,
    delayEnabled: true,
    delayTime: '8n.',
    delayFeedback: 0.25,
    delayMix: 0.2,
    reverbEnabled: true,
    reverbDecay: 3.0,
    reverbMix: 0.35
  },
  // Pluck - dotted delay for arps
  pluck: {
    filterEnabled: false,
    filterType: 'lowpass',
    filterFreq: 4000,
    filterQ: 1,
    delayEnabled: true,
    delayTime: '8n.',
    delayFeedback: 0.4,
    delayMix: 0.35,
    reverbEnabled: true,
    reverbDecay: 1.5,
    reverbMix: 0.25
  },
  // Stab - short reverb, punchy
  stab: {
    filterEnabled: false,
    filterType: 'lowpass',
    filterFreq: 3500,
    filterQ: 1,
    delayEnabled: true,
    delayTime: '8n',
    delayFeedback: 0.3,
    delayMix: 0.25,
    reverbEnabled: true,
    reverbDecay: 1.2,
    reverbMix: 0.2
  },
  // Acid - resonant lowpass filter, classic 303
  acid: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 1200,
    filterQ: 8,
    delayEnabled: true,
    delayTime: '16n',
    delayFeedback: 0.35,
    delayMix: 0.25,
    reverbEnabled: false,
    reverbDecay: 1.5,
    reverbMix: 0.15
  },
  // Acid Bright - higher filter, more resonance
  acidBright: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 2500,
    filterQ: 12,
    delayEnabled: true,
    delayTime: '16n',
    delayFeedback: 0.4,
    delayMix: 0.3,
    reverbEnabled: false,
    reverbDecay: 1.0,
    reverbMix: 0.1
  },
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
  // Acid Square - bandpass for hollow sound
  acidSquare: {
    filterEnabled: true,
    filterType: 'bandpass',
    filterFreq: 1500,
    filterQ: 4,
    delayEnabled: true,
    delayTime: '8n.',
    delayFeedback: 0.35,
    delayMix: 0.3,
    reverbEnabled: false,
    reverbDecay: 1.5,
    reverbMix: 0.15
  },
  // Acid Soft - gentle filter, more reverb
  acidSoft: {
    filterEnabled: true,
    filterType: 'lowpass',
    filterFreq: 1800,
    filterQ: 3,
    delayEnabled: true,
    delayTime: '4n',
    delayFeedback: 0.3,
    delayMix: 0.25,
    reverbEnabled: true,
    reverbDecay: 2.0,
    reverbMix: 0.3
  }
}

function createSynth(type: SynthType): Tone.PolySynth {
  switch (type) {
    // === SAW ===
    case 'saw':
      // Classic trance saw - punchy and full
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', spread: 20, count: 5 },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.3, release: 0.4 }
      })
    case 'supersaw':
      // Wide supersaw - detuned for big sound
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', spread: 50, count: 7 },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.6 }
      })

    // === PLUCK / STAB ===
    case 'pluck':
      // Short percussive pluck
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', spread: 20, count: 4 },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 }
      })
    case 'stab':
      // Classic trance stab
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', spread: 30, count: 5 },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.1 }
      })

    // === ACID VARIANTS ===
    case 'acid':
      // Classic 303 acid - pure saw, snappy
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0.05, release: 0.1 }
      })
    case 'acidBright':
      // Bright acid - more attack, cutting
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0.1, release: 0.05 }
      })
    case 'acidDark':
      // Dark acid - longer decay, moody
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.15 }
      })
    case 'acidSquare':
      // Square wave acid - hollow, aggressive
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.08, release: 0.08 }
      })
    case 'acidSoft':
      // Soft acid - gentler attack, rounder
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.12 }
      })

    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', spread: 20, count: 5 },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.3, release: 0.4 }
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
  const [synthType, setSynthType] = useState<SynthType>('saw')

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
    synthRef.current.volume.value = -6

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
    setReverbMix
  }
}
