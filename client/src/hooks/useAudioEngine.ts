import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import type { Pattern, SynthType, FilterType, DelayTime } from '../types'
import { SCALES, scaleDegreeToMidi } from '../scales'
import { TOTAL_STEPS } from '../types'

function createSynth(type: SynthType): Tone.PolySynth | Tone.PluckSynth | Tone.FMSynth {
  switch (type) {
    case 'saw':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
      })
    case 'square':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 }
      })
    case 'sine':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.4 }
      })
    case 'triangle':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.3 }
      })
    case 'pluck':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 }
      })
    case 'fm':
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 }
      })
    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
      })
  }
}

export function useAudioEngine(pattern: Pattern, tempo: number) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isLooping, setIsLooping] = useState(true)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [metronomeVolume, setMetronomeVolume] = useState(-12) // dB
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

  const synthRef = useRef<Tone.PolySynth | Tone.PluckSynth | Tone.FMSynth | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const delayRef = useRef<Tone.FeedbackDelay | null>(null)
  const delayGainRef = useRef<Tone.Gain | null>(null)
  const dryGainRef = useRef<Tone.Gain | null>(null)
  const metronomeRef = useRef<Tone.MembraneSynth | null>(null)
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

    return () => {
      filterRef.current?.dispose()
      delayRef.current?.dispose()
      delayGainRef.current?.dispose()
      dryGainRef.current?.dispose()
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

  // Initialize/update synth and routing when type or effects change
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.dispose()
    }

    synthRef.current = createSynth(synthType)
    synthRef.current.volume.value = -6

    // Build signal chain based on enabled effects
    // Synth -> [Filter] -> [Delay mix] -> Destination
    let currentNode: Tone.ToneAudioNode = synthRef.current

    if (filterEnabled && filterRef.current) {
      currentNode.connect(filterRef.current)
      currentNode = filterRef.current
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
  }, [synthType, filterEnabled, delayEnabled])

  // Initialize metronome
  useEffect(() => {
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

    return () => {
      metronomeRef.current?.dispose()
    }
  }, [])

  // Update metronome volume
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeVolume
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

    const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i)

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
          const isDownbeat = step % 16 === 0
          metronomeRef.current?.triggerAttackRelease(
            isDownbeat ? 'C2' : 'C3',
            '32n',
            time
          )
        }

        // Handle loop
        if (step === TOTAL_STEPS - 1 && !isLooping) {
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
  }, [isLooping, metronomeEnabled])

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
    synthType,
    setSynthType,
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
    setDelayMix
  }
}
