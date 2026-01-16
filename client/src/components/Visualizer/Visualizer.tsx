import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

interface VisualizerProps {
  isPlaying: boolean
}

export function Visualizer({ isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyzerRef = useRef<Tone.Analyser | null>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    // Create FFT analyzer and connect to master output
    analyzerRef.current = new Tone.Analyser('fft', 32)
    Tone.getDestination().connect(analyzerRef.current)

    return () => {
      analyzerRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const analyzer = analyzerRef.current
    if (!canvas || !analyzer) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const values = analyzer.getValue() as Float32Array
      const width = canvas.width
      const height = canvas.height

      // Clear
      ctx.clearRect(0, 0, width, height)

      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      const barCount = values.length
      const barWidth = width / barCount
      const gap = 2

      for (let i = 0; i < barCount; i++) {
        // Convert dB to linear (values are in dB, typically -100 to 0)
        const db = values[i]
        // More aggressive scaling for visibility
        const normalized = Math.max(0, Math.min(1, (db + 60) / 50))
        const barHeight = Math.max(4, normalized * height * 0.95)

        const x = i * barWidth
        const y = height - barHeight

        // CRT phosphor green theme - slight hue variation for depth
        const hue = 120 + (i / barCount) * 20 - 10 // Green range: 110-130
        const lightness = 50 + (normalized * 15) // Brighter when louder
        ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, 0.85)`

        // Draw bar with rounded top
        ctx.beginPath()
        ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, 2)
        ctx.fill()

        // CRT glow effect
        ctx.shadowColor = '#33ff33'
        ctx.shadowBlur = 12
      }

      ctx.shadowBlur = 0
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  if (!isPlaying) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={50}
        className="opacity-70"
        style={{ width: '100%', maxWidth: '600px', height: '100%' }}
      />
    </div>
  )
}
