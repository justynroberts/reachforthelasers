import { Copy, Scissors, ClipboardPaste, CopyPlus, Repeat2, Eraser, ChevronsDown } from 'lucide-react'

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
}

const BAR_PRESETS = [
  { bars: 4, label: '4 bars' },
  { bars: 8, label: '8 bars' },
  { bars: 16, label: '16 bars' },
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
  onOctaveDown
}: EditToolbarProps) {
  const currentBars = selectionEnd - selectionStart

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

      {/* Edit Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Copy"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={onCut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Cut"
        >
          <Scissors className="w-4 h-4" />
        </button>

        <button
          onClick={onPaste}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Paste"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>

        <button
          onClick={onDuplicate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Duplicate"
        >
          <CopyPlus className="w-4 h-4" />
        </button>

        <button
          onClick={onLoop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Fill pattern"
        >
          <Repeat2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOctaveDown}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Add octave down"
        >
          <ChevronsDown className="w-4 h-4" />
        </button>

        <button
          onClick={onClearSelection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-grid-line text-gray-300 hover:bg-grid-bar transition-colors"
          title="Erase"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
