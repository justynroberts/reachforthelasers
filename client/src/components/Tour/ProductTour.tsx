import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const TOUR_STORAGE_KEY = 'reach-for-lasers-tour-complete'

interface TourStep {
  title: string
  description: string
  target?: string // CSS selector for highlighting
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Reach for the Lasers',
    description: 'Create trance lead patterns with this browser-based sequencer. Click on the grid to add notes, then hit play to hear your creation.',
  },
  {
    title: 'Browse Patterns',
    description: 'Check out the Browse tab for pre-made rolling patterns. Load one to get started quickly, then customize it.',
  },
  {
    title: 'Choose Your Sound',
    description: 'Select from 15 synth sounds including Hyper Saw, Hoover, Reese, and more. Each has its own character.',
  },
  {
    title: 'Add Effects',
    description: 'Use Filter, Echo (delay), and Reverb to shape your sound. Try the filter sweep for that classic trance feel.',
  },
  {
    title: 'Select Bars & Edit',
    description: 'Use the bar selector to pick a range, then copy, paste, duplicate, or loop your selection. Add octave harmonics with the +8va button.',
  },
  {
    title: 'Export & Save',
    description: 'Export your pattern as MIDI to use in your DAW. Patterns can also be saved to your local catalog with sound settings included.',
  },
]

interface ProductTourProps {
  onComplete: () => void
}

export function ProductTour({ onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if tour has been completed
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed) {
      setVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setVisible(false)
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!visible) return null

  const step = tourSteps[currentStep]
  const isLast = currentStep === tourSteps.length - 1
  const isFirst = currentStep === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleSkip} />

      {/* Tour Card */}
      <div className="relative bg-grid-bg border border-note-active/50 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-grid-line">
          <div
            className="h-full bg-note-active transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="text-xs text-note-active font-medium mb-2">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
          <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
          <p className="text-gray-300 leading-relaxed">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-grid-line/50 border-t border-grid-line">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Skip tour
          </button>

          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 bg-grid-line text-gray-300 rounded-lg hover:bg-grid-bar transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-note-active text-grid-bg rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useTourComplete(): [boolean, () => void] {
  const [complete, setComplete] = useState(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  })

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY)
    setComplete(false)
  }

  return [complete, resetTour]
}
