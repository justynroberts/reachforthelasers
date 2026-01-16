import { createContext, useContext, useState, ReactNode } from 'react'

interface TooltipContextType {
  tooltip: string
  setTooltip: (text: string) => void
}

const TooltipContext = createContext<TooltipContextType>({
  tooltip: '',
  setTooltip: () => {}
})

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltip, setTooltip] = useState('')

  return (
    <TooltipContext.Provider value={{ tooltip, setTooltip }}>
      {children}
    </TooltipContext.Provider>
  )
}

export function useTooltip() {
  return useContext(TooltipContext)
}

export function TooltipBar() {
  const { tooltip } = useTooltip()

  return (
    <div className="h-6 px-4 bg-grid-line/50 border-t border-grid-line flex items-center">
      <span className="text-xs text-gray-400">
        {tooltip || 'Hover over controls for help'}
      </span>
    </div>
  )
}

// Helper component for tooltipped elements
interface TooltippedProps {
  tip: string
  children: ReactNode
  className?: string
}

export function Tooltipped({ tip, children, className = '' }: TooltippedProps) {
  const { setTooltip } = useTooltip()

  return (
    <div
      className={className}
      onMouseEnter={() => setTooltip(tip)}
      onMouseLeave={() => setTooltip('')}
    >
      {children}
    </div>
  )
}
