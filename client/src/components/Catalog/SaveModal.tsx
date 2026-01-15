import { useState } from 'react'
import { TAGS, type Tag } from '../../types'

interface SaveModalProps {
  onClose: () => void
  onSaved: () => void
}

export function SaveModal({ onClose, onSaved }: SaveModalProps) {
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev
    )
  }

  const handleSave = async () => {
    if (!description.trim()) {
      setError('Description is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          name: name.trim() || undefined,
          tags: selectedTags
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save pattern')
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-grid-bg border border-grid-line rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-grid-line">
          <h2 className="text-lg font-medium">Save to Catalog</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What makes this pattern interesting? e.g., 'Rolling psy lead with octave jumps'"
              className="w-full px-3 py-2 bg-grid-line border border-grid-bar rounded resize-none h-24"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/500
            </div>
          </div>

          {/* Name (optional) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Name <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Auto-generated if blank"
              className="w-full px-3 py-2 bg-grid-line border border-grid-bar rounded"
              maxLength={100}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Tags <span className="text-gray-600">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-note-active text-grid-bg'
                      : 'bg-grid-line text-gray-400 hover:bg-grid-bar'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-grid-line">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-grid-line text-gray-300 rounded hover:bg-grid-bar"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !description.trim()}
            className="px-4 py-2 bg-note-active text-grid-bg rounded hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Pattern'}
          </button>
        </div>
      </div>
    </div>
  )
}
