import { useState, useEffect, useCallback, useMemo } from 'react'
import type { CatalogPattern, ScaleType, Note, Tag } from '../../types'
import { TAGS } from '../../types'
import { SCALES } from '../../scales'
import { PRESETS } from '../../presets'
import { SaveModal } from './SaveModal'
import type { SoundSettings } from '../Export/ExportModal'

interface CatalogProps {
  onLoadPattern: (pattern: {
    notes: Note[]
    scale: ScaleType
    rootNote: number
    tempo: number
    soundSettings?: SoundSettings
  }) => void
}

type SortOption = 'newest' | 'mostLoaded' | 'random'

const CATALOG_STORAGE_KEY = 'reach-for-lasers-user-patterns'

// Generate built-in patterns from presets
function generateBuiltInPatterns(): CatalogPattern[] {
  return PRESETS.map((preset, index) => {
    const scaleData = SCALES[preset.recommendedScale]
    const stepsPerOctave = scaleData.intervals.length
    const notes = preset.generate({ stepsPerOctave, octaves: 4 })

    return {
      id: `preset-${index}`,
      name: preset.name,
      description: preset.description,
      notes,
      scale: preset.recommendedScale,
      rootNote: 45, // A2
      tempo: preset.suggestedTempo,
      tags: [preset.complexity === 'simple' ? 'Simple' : preset.complexity === 'complex' ? 'Complex' : 'Melodic'] as Tag[],
      createdAt: new Date().toISOString(),
      loadCount: 0
    }
  })
}

// Load user-saved patterns from localStorage
function loadUserPatterns(): (CatalogPattern & { soundSettings?: SoundSettings })[] {
  try {
    const stored = localStorage.getItem(CATALOG_STORAGE_KEY)
    if (!stored) return []
    const patterns = JSON.parse(stored)
    return patterns.map((p: { id: string; name: string; notes: Note[]; scale: ScaleType; rootNote: number; tempo: number; soundSettings?: SoundSettings; createdAt: string }) => ({
      ...p,
      description: 'User created pattern',
      tags: ['User'] as Tag[],
      loadCount: 0
    }))
  } catch {
    return []
  }
}

export function Catalog({ onLoadPattern }: CatalogProps) {
  const [patterns, setPatterns] = useState<CatalogPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Built-in presets
  const builtInPatterns = useMemo(() => generateBuiltInPatterns(), [])

  // User-saved patterns from localStorage
  const [userPatterns, setUserPatterns] = useState<CatalogPattern[]>([])

  // Refresh user patterns when catalog opens or after save
  const refreshUserPatterns = useCallback(() => {
    setUserPatterns(loadUserPatterns())
  }, [])

  useEffect(() => {
    refreshUserPatterns()
  }, [refreshUserPatterns])

  const fetchPatterns = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('sort', sort)
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))

      const response = await fetch(`/api/patterns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch patterns')

      const data = await response.json()
      setPatterns(data.patterns)
    } catch {
      // Server not running - use built-in patterns only
      setPatterns([])
    } finally {
      setLoading(false)
    }
  }, [search, sort, selectedTags])

  useEffect(() => {
    fetchPatterns()
  }, [fetchPatterns])

  // Combine user, built-in and server patterns, filter by search
  const allPatterns = useMemo(() => {
    // User patterns first, then built-in, then server
    const combined = [...userPatterns, ...builtInPatterns, ...patterns]
    if (!search) return combined
    const searchLower = search.toLowerCase()
    return combined.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    )
  }, [userPatterns, builtInPatterns, patterns, search])

  const handleLoad = async (pattern: CatalogPattern & { soundSettings?: SoundSettings }) => {
    // Increment load count
    try {
      await fetch(`/api/patterns/${pattern.id}/load`, { method: 'POST' })
    } catch {
      // Ignore errors - don't block loading
    }

    onLoadPattern({
      notes: pattern.notes,
      scale: pattern.scale,
      rootNote: pattern.rootNote,
      tempo: pattern.tempo,
      soundSettings: pattern.soundSettings
    })
  }

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-grid-line">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search patterns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-grid-line border border-grid-bar rounded"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="px-4 py-2 bg-grid-line border border-grid-bar rounded"
          >
            <option value="newest">Newest</option>
            <option value="mostLoaded">Most Loaded</option>
            <option value="random">Random</option>
          </select>
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-note-active text-grid-bg rounded hover:opacity-90"
          >
            Save Current Pattern
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
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

      {/* Pattern List */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading patterns...</div>
        ) : allPatterns.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No patterns found. Try a different search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPatterns.map(pattern => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                onLoad={() => handleLoad(pattern)}
              />
            ))}
          </div>
        )}
      </div>

      {showSaveModal && (
        <SaveModal
          onClose={() => setShowSaveModal(false)}
          onSaved={fetchPatterns}
        />
      )}
    </div>
  )
}

interface PatternCardProps {
  pattern: CatalogPattern
  onLoad: () => void
}

function PatternCard({ pattern, onLoad }: PatternCardProps) {
  return (
    <div className="bg-grid-line rounded-lg p-4 hover:bg-grid-bar transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-white">{pattern.name}</h3>
        <span className="text-xs text-gray-500">
          {pattern.loadCount} loads
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
        {pattern.description}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span>{SCALES[pattern.scale].name}</span>
        <span>•</span>
        <span>{pattern.tempo} BPM</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {pattern.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-grid-bg rounded text-xs text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={onLoad}
        className="w-full px-4 py-2 bg-note-active text-grid-bg rounded hover:opacity-90 transition-opacity text-sm"
      >
        Load Pattern
      </button>
    </div>
  )
}
