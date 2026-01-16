import { useState, useEffect } from 'react'

const BOOT_STORAGE_KEY = 'reach-for-lasers-booted'

interface BootSequenceProps {
  onComplete: () => void
}

const bootMessages = [
  { text: 'FINTONLABS AUDIO WORKSTATION', delay: 0 },
  { text: 'REACH FOR THE LASERS v1.0', delay: 400 },
  { text: '', delay: 600 },
  { text: 'INITIALIZING AUDIO SYSTEM...', delay: 800 },
  { text: 'LOADING VOICE BANKS...', delay: 1200 },
  { text: 'VOICE: ACID DARK I         [OK]', delay: 1600 },
  { text: 'VOICE: ACID DARK II        [OK]', delay: 1800 },
  { text: 'VOICE: ACID DARK III       [OK]', delay: 2000 },
  { text: 'VOICE: ACID DARK IV        [OK]', delay: 2200 },
  { text: 'VOICE: ACID DARK V         [OK]', delay: 2400 },
  { text: '', delay: 2600 },
  { text: 'MEMORY TEST...             256 STEPS', delay: 2800 },
  { text: 'SCALE ENGINE...            [OK]', delay: 3100 },
  { text: 'EFFECTS PROCESSOR...       [OK]', delay: 3400 },
  { text: '', delay: 3600 },
  { text: 'SYSTEM READY', delay: 3800 },
  { text: '', delay: 4000 },
  { text: 'PRESS ANY KEY TO CONTINUE', delay: 4200 },
]

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [showCursor, setShowCursor] = useState(true)
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    // Check if we've already booted this session
    const hasBooted = sessionStorage.getItem(BOOT_STORAGE_KEY)
    if (hasBooted) {
      onComplete()
      return
    }

    // Show lines progressively
    bootMessages.forEach((msg, index) => {
      setTimeout(() => {
        setVisibleLines(index + 1)
        if (index === bootMessages.length - 1) {
          setCanSkip(true)
        }
      }, msg.delay)
    })

    // Blinking cursor
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(cursorInterval)
  }, [onComplete])

  const handleSkip = () => {
    sessionStorage.setItem(BOOT_STORAGE_KEY, 'true')
    onComplete()
  }

  useEffect(() => {
    const handleKeyDown = () => {
      if (canSkip) {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleKeyDown)
    }
  }, [canSkip])

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <div className="w-full max-w-2xl p-8 font-mono">
        {/* CRT screen effect container */}
        <div className="relative bg-[#0a0a0a] border-4 border-[#1a1a1a] rounded-lg p-6 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]">
          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px)'
            }}
          />

          {/* Boot text */}
          <div className="relative z-10 min-h-[400px]">
            {bootMessages.slice(0, visibleLines).map((msg, index) => (
              <div
                key={index}
                className={`text-sm leading-relaxed ${
                  msg.text.includes('[OK]')
                    ? 'text-[#33ff33]'
                    : msg.text.includes('PRESS ANY KEY')
                    ? 'text-[#33ff33] animate-pulse'
                    : msg.text === ''
                    ? 'h-4'
                    : 'text-[#22aa22]'
                }`}
                style={{
                  textShadow: msg.text ? '0 0 10px rgba(51, 255, 51, 0.5)' : 'none'
                }}
              >
                {msg.text}
                {index === visibleLines - 1 && showCursor && (
                  <span className="text-[#33ff33]">_</span>
                )}
              </div>
            ))}
          </div>

          {/* Skip hint */}
          {!canSkip && (
            <div className="absolute bottom-4 right-4 text-xs text-[#1a5a1a]">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
