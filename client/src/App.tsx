import { useState, useCallback, useRef } from 'react'
import { Grid } from './components/Grid/Grid'
import { Transport } from './components/Transport/Transport'
import { ScaleSelector } from './components/ScaleSelector/ScaleSelector'
import { ChordTrack } from './components/ChordTrack/ChordTrack'
import { Catalog } from './components/Catalog/Catalog'
import { ExportModal } from './components/Export/ExportModal'
import { EffectsPanel } from './components/Effects/EffectsPanel'
import { EditToolbar } from './components/EditToolbar/EditToolbar'
import { useAudioEngine } from './hooks/useAudioEngine'
import { usePattern } from './hooks/usePattern'
import { useTheme } from './hooks/useTheme'
import { Music, Library, Sun, Moon, Trash2, Download, Zap } from 'lucide-react'
import type { ScaleType, Note } from './types'
import { SCALES } from './scales'

type Tab = 'editor' | 'catalog'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('editor')
  const [showExportModal, setShowExportModal] = useState(false)
  const [centerTrigger, setCenterTrigger] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  const {
    pattern,
    setNotes,
    toggleNote,
    clearPattern,
    loadPattern,
    scale,
    setScale,
    rootNote,
    setRootNote,
    tempo,
    setTempo,
    chords,
    addChord,
    removeChord,
    // Editing
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    copySelection,
    cutSelection,
    pasteAtSelection,
    duplicateSelection,
    loopSelection,
    clearSelection,
    addOctaveDown
  } = usePattern()

  const {
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
  } = useAudioEngine(pattern, tempo)

  const handleLoadFromCatalog = useCallback((catalogPattern: {
    notes: Note[]
    scale: ScaleType
    rootNote: number
    tempo: number
  }) => {
    // Calculate the pitch range of the incoming notes
    const pitches = catalogPattern.notes.map(n => n.pitch)
    const minPitch = Math.min(...pitches)
    const maxPitch = Math.max(...pitches)
    const noteCenter = (minPitch + maxPitch) / 2

    // Get the total pitch count for this scale
    const scaleData = SCALES[catalogPattern.scale]
    const pitchCount = scaleData.intervals.length * 5 // 5 octaves

    // Calculate offset to center notes in the middle of the range (octave 3-4)
    const gridCenter = pitchCount / 2
    const offset = Math.round(gridCenter - noteCenter)

    // Shift all notes by the offset, clamping to valid range
    const centeredNotes = catalogPattern.notes.map(note => ({
      ...note,
      pitch: Math.max(0, Math.min(pitchCount - 1, note.pitch + offset))
    }))

    loadPattern({
      ...catalogPattern,
      notes: centeredNotes
    })
    setActiveTab('editor')
    // Trigger centering on the loaded notes
    setCenterTrigger(prev => prev + 1)
  }, [loadPattern])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-grid-line">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-note-active" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            Reach for the Lasers
          </h1>
        </div>
        <nav className="flex items-center gap-3">
          <div className="flex gap-1 bg-grid-line p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-note-active text-grid-bg shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
              Create
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-note-active text-grid-bg shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Library className="w-4 h-4" />
              Browse
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg bg-grid-line hover:bg-grid-bar transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'editor' ? (
          <div className="flex flex-col h-full">
            {/* Controls Bar */}
            <div className="flex items-center gap-6 px-6 py-4 border-b border-grid-line">
              <Transport
                isPlaying={isPlaying}
                onPlay={play}
                onStop={stop}
                tempo={tempo}
                onTempoChange={setTempo}
                isLooping={isLooping}
                onLoopChange={setIsLooping}
                metronomeEnabled={metronomeEnabled}
                onMetronomeChange={setMetronomeEnabled}
                metronomeVolume={metronomeVolume}
                onMetronomeVolumeChange={setMetronomeVolume}
                synthType={synthType}
                onSynthTypeChange={setSynthType}
              />
              <div className="w-px h-8 bg-grid-line" />
              <ScaleSelector
                scale={scale}
                onScaleChange={setScale}
                rootNote={rootNote}
                onRootNoteChange={setRootNote}
              />
              <div className="flex-1" />
              <div className="flex gap-2">
                <button
                  onClick={clearPattern}
                  className="flex items-center gap-2 px-4 py-2 bg-grid-line text-gray-300 rounded-lg hover:bg-grid-bar transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-note-active text-grid-bg rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Effects & Edit Bar */}
            <div className="flex items-center justify-between gap-6 px-6 py-3 border-b border-grid-line bg-grid-bg/50">
              <EffectsPanel
                filterEnabled={filterEnabled}
                onFilterEnabledChange={setFilterEnabled}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterFreq={filterFreq}
                onFilterFreqChange={setFilterFreq}
                filterQ={filterQ}
                onFilterQChange={setFilterQ}
                delayEnabled={delayEnabled}
                onDelayEnabledChange={setDelayEnabled}
                delayTime={delayTime}
                onDelayTimeChange={setDelayTime}
                delayFeedback={delayFeedback}
                onDelayFeedbackChange={setDelayFeedback}
                delayMix={delayMix}
                onDelayMixChange={setDelayMix}
              />
              <EditToolbar
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                onSelectionStartChange={setSelectionStart}
                onSelectionEndChange={setSelectionEnd}
                onCopy={copySelection}
                onCut={cutSelection}
                onPaste={pasteAtSelection}
                onDuplicate={duplicateSelection}
                onLoop={loopSelection}
                onClearSelection={clearSelection}
                onOctaveDown={addOctaveDown}
              />
            </div>

            {/* Chord Track + Grid */}
            <div ref={scrollContainerRef} className="flex-1 overflow-auto">
              <ChordTrack
                chords={chords}
                onAddChord={addChord}
                onRemoveChord={removeChord}
                currentStep={currentStep}
                isPlaying={isPlaying}
              />
              <Grid
                notes={pattern.notes}
                scale={SCALES[scale]}
                rootNote={rootNote}
                currentStep={currentStep}
                isPlaying={isPlaying}
                onToggleNote={toggleNote}
                onNotesChange={setNotes}
                centerTrigger={centerTrigger}
                scrollContainerRef={scrollContainerRef}
              />
            </div>
          </div>
        ) : (
          <Catalog onLoadPattern={handleLoadFromCatalog} />
        )}
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          pattern={pattern}
          scale={scale}
          rootNote={rootNote}
          tempo={tempo}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}
