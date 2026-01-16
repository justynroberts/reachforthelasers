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
    // Create FFT analyzer with low resolution for retro look
    analyzerRef.current = new Tone.Analyser('fft', 16)
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

    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false

    const draw = () => {
      const values = analyzer.getValue() as Float32Array
      const width = canvas.width
      const height = canvas.height

      // Clear with slight trail for CRT phosphor persistence
      ctx.fillStyle = 'rgba(10, 10, 10, 0.3)'
      ctx.fillRect(0, 0, width, height)

      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      const barCount = values.length
      const barWidth = Math.floor(width / barCount)
      const pixelSize = 4 // Size of each "pixel" block
      const gap = 2

      for (let i = 0; i < barCount; i++) {
        // Convert dB to linear
        const db = values[i]
        const normalized = Math.max(0, Math.min(1, (db + 60) / 50))

        // Quantize height to pixel grid for stepped look
        const maxBlocks = Math.floor(height / pixelSize)
        const numBlocks = Math.max(1, Math.floor(normalized * maxBlocks))

        const x = i * barWidth + gap

        // Draw stacked pixel blocks from bottom
        for (let block = 0; block < numBlocks; block++) {
          const y = height - (block + 1) * pixelSize

          // Intensity varies by height - brighter at top
          const intensity = 0.4 + (block / maxBlocks) * 0.6
          const green = Math.floor(180 + intensity * 75)

          ctx.fillStyle = `rgb(20, ${green}, 20)`
          ctx.fillRect(x, y, barWidth - gap * 2, pixelSize - 1)

          // Add scanline gap between blocks
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.fillRect(x, y + pixelSize - 1, barWidth - gap * 2, 1)
        }

        // Add glow on top block
        if (numBlocks > 0) {
          const topY = height - numBlocks * pixelSize
          ctx.shadowColor = '#33ff33'
          ctx.shadowBlur = 8
          ctx.fillStyle = '#44ff44'
          ctx.fillRect(x, topY, barWidth - gap * 2, pixelSize - 1)
          ctx.shadowBlur = 0
        }
      }

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
        width={320}
        height={48}
        className="opacity-80"
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  )
}
