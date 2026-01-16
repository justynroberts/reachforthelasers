import { Copy, Scissors, ClipboardPaste, CopyPlus, Repeat2, Eraser, ChevronsDown, Undo2, Redo2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import { useTooltip } from '../Tooltip/TooltipBar'

interface EditToolbarProps {
  selectionStart: number
  selectionEnd: number
  onSelectionStartChange: (bar: number) => void
  onSelectionEndChange: (bar: number) => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onDuplicate: () => void
  onLoop: () => void
  onClearSelection: () => void
  onOctaveDown: () => void
  onNudgeLeft: () => void
  onNudgeRight: () => void
  onTransposeUp: () => void
  onTransposeDown: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

const BAR_PRESETS = [
  { bars: 1, label: '1' },
  { bars: 2, label: '2' },
  { bars: 4, label: '4' },
  { bars: 8, label: '8' },
  { bars: 16, label: '16' },
]

export function EditToolbar({
  selectionStart,
  selectionEnd,
  onSelectionStartChange,
  onSelectionEndChange,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onLoop,
  onClearSelection,
  onOctaveDown,
  onNudgeLeft,
  onNudgeRight,
  onTransposeUp,
  onTransposeDown,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: EditToolbarProps) {
  const { setTooltip } = useTooltip()
  const currentBars = selectionEnd - selectionStart

  const tip = (text: string) => ({
    onMouseEnter: () => setTooltip(text),
    onMouseLeave: () => setTooltip('')
  })

  const handlePresetChange = (bars: number) => {
    onSelectionStartChange(0)
    onSelectionEndChange(bars)
  }

  return (
    <div className="flex items-center gap-4">
      {/* Bar Presets */}
      <div className="flex items-center gap-1 bg-grid-line p-1 rounded-lg">
        {BAR_PRESETS.map(preset => (
          <button
            key={preset.bars}
            onClick={() => handlePresetChange(preset.bars)}
            {...tip(`Loop ${preset.bars} bar${preset.bars > 1 ? 's' : ''}`)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
              currentBars === preset.bars && selectionStart === 0
                ? 'bg-note-active text-grid-bg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-grid-line" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          {...tip('Undo last action')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canUndo
              ? 'bg-grid-line text-gray-300 hover:bg-grid-bar'
              : 'bg-grid-line text-gray-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          {...tip('Redo last undone action')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canRedo
              ? 'bg-grid-line text-gray-300 hover:bg-grid-bar'
              : 'bg-grid-line text-gray-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-grid-line" />

      {/* Edit Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onCopy}
          {...tip('Copy selected bars to clipboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={onCut}
          {...tip('Cut selected bars to clipboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <Scissors className="w-4 h-4" />
        </button>

        <button
          onClick={onPaste}
          {...tip('Paste clipboard at selection start')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>

        <button
          onClick={onDuplicate}
          {...tip('Duplicate and extend loop to the right')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <CopyPlus className="w-4 h-4" />
        </button>

        <button
          onClick={onLoop}
          {...tip('Fill entire pattern by repeating selected bars')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <Repeat2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOctaveDown}
          {...tip('Add octave below the lowest notes')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <ChevronsDown className="w-4 h-4" />
        </button>

        <button
          onClick={onClearSelection}
          {...tip('Erase all notes in selected bars')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-grid-line" />

      {/* Nudge */}
      <div className="flex items-center gap-1">
        <button
          onClick={onNudgeLeft}
          {...tip('Nudge pattern left by 1 step (wraps around)')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onNudgeRight}
          {...tip('Nudge pattern right by 1 step (wraps around)')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-grid-line" />

      {/* Transpose */}
      <div className="flex items-center gap-1">
        <button
          onClick={onTransposeDown}
          {...tip('Transpose pattern down by 1 note')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <button
          onClick={onTransposeUp}
          {...tip('Transpose pattern up by 1 note')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
