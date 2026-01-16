import { useState, useCallback, useRef } from 'react'
import { Grid } from './components/Grid/Grid'
import { Transport } from './components/Transport/Transport'
import { ScaleSelector } from './components/ScaleSelector/ScaleSelector'
import { ChordTrack } from './components/ChordTrack/ChordTrack'
import { Catalog } from './components/Catalog/Catalog'
import { ExportModal } from './components/Export/ExportModal'
import { EffectsPanel } from './components/Effects/EffectsPanel'
import { EditToolbar } from './components/EditToolbar/EditToolbar'
import { Visualizer } from './components/Visualizer/Visualizer'
import { ProductTour } from './components/Tour/ProductTour'
import { BootSequence } from './components/Boot/BootSequence'
import { AboutModal } from './components/About/AboutModal'
import { TooltipProvider, TooltipBar, Tooltipped } from './components/Tooltip/TooltipBar'
import { useAudioEngine } from './hooks/useAudioEngine'
import { usePattern } from './hooks/usePattern'
import { Music, Library, Trash2, Download, Zap, HelpCircle, Info, SlidersHorizontal, ChevronRight } from 'lucide-react'
import type { ScaleType, Note } from './types'
import { STEPS_PER_BAR } from './types'
import { SCALES } from './scales'

type Tab = 'editor' | 'catalog'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('editor')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showTour, setShowTour] = useState(true)
  const [showAbout, setShowAbout] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [booted, setBooted] = useState(() => sessionStorage.getItem('reach-for-lasers-booted') === 'true')
  const [centerTrigger, setCenterTrigger] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    addOctaveDown,
    nudgeLeft,
    nudgeRight,
    transposeUp,
    transposeDown,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePattern()

  // Convert bar selection to steps for loop boundaries
  const loopStartStep = selectionStart * STEPS_PER_BAR
  const loopEndStep = selectionEnd * STEPS_PER_BAR

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
    metronomeType,
    setMetronomeType,
    synthType,
    setSynthType,
    synthVolume,
    setSynthVolume,
    applyPreset,
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
    setDelayMix,
    // Reverb
    reverbEnabled,
    setReverbEnabled,
    reverbDecay,
    setReverbDecay,
    reverbMix,
    setReverbMix,
    // Filter sweep
    filterSweepActive,
    triggerFilterSweep
  } = useAudioEngine(pattern, tempo, loopStartStep, loopEndStep)

  const handleLoadFromCatalog = useCallback((catalogPattern: {
    notes: Note[]
    scale: ScaleType
    rootNote: number
    tempo: number
    soundSettings?: {
      synthType: typeof synthType
      filterEnabled: boolean
      filterType: typeof filterType
      filterFreq: number
      filterQ: number
      delayEnabled: boolean
      delayTime: typeof delayTime
      delayFeedback: number
      delayMix: number
      reverbEnabled: boolean
      reverbDecay: number
      reverbMix: number
    }
    loopStart?: number
    loopEnd?: number
  }) => {
    // Calculate the pitch range of the incoming notes
    const pitches = catalogPattern.notes.map(n => n.pitch)
    const minPitch = Math.min(...pitches)
    const maxPitch = Math.max(...pitches)
    const noteCenter = (minPitch + maxPitch) / 2

    // Get the total pitch count for this scale
    const scaleData = SCALES[catalogPattern.scale]
    const pitchCount = scaleData.intervals.length * 4 // 4 octaves (A2-A5)

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

    // Apply sound settings if present
    if (catalogPattern.soundSettings) {
      const s = catalogPattern.soundSettings
      setSynthType(s.synthType)
      setFilterEnabled(s.filterEnabled)
      setFilterType(s.filterType)
      setFilterFreq(s.filterFreq)
      setFilterQ(s.filterQ)
      setDelayEnabled(s.delayEnabled)
      setDelayTime(s.delayTime)
      setDelayFeedback(s.delayFeedback)
      setDelayMix(s.delayMix)
      setReverbEnabled(s.reverbEnabled)
      setReverbDecay(s.reverbDecay)
      setReverbMix(s.reverbMix)
    }

    // Apply loop settings - use saved values or auto-detect from pattern length
    if (catalogPattern.loopStart !== undefined && catalogPattern.loopEnd !== undefined) {
      setSelectionStart(catalogPattern.loopStart)
      setSelectionEnd(catalogPattern.loopEnd)
    } else {
      // Auto-detect pattern length and set loop accordingly
      const lastStep = Math.max(...catalogPattern.notes.map(note => note.step + note.length))
      const patternBars = Math.ceil(lastStep / STEPS_PER_BAR)
      setSelectionStart(0)
      setSelectionEnd(Math.max(1, patternBars)) // At least 1 bar
    }

    setActiveTab('editor')
    // Trigger centering on the loaded notes
    setCenterTrigger(prev => prev + 1)
  }, [loadPattern, setSynthType, setFilterEnabled, setFilterType, setFilterFreq, setFilterQ,
      setDelayEnabled, setDelayTime, setDelayFeedback, setDelayMix,
      setReverbEnabled, setReverbDecay, setReverbMix, setSelectionStart, setSelectionEnd])

  // Show boot sequence on first load
  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />
  }

  return (
    <TooltipProvider>
    <div className="flex flex-col h-screen">
      {/* Animated background */}
      <div className="animated-bg" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-grid-line bg-grid-bg/80 backdrop-blur-sm">
        <Visualizer isPlaying={isPlaying} />
        <div className="relative z-10 flex items-center gap-3">
          <h1 className="text-4xl font-bold text-note-active tracking-tight title-glow title-font">
            Reach for the Lasers
          </h1>
          <span className="text-xs text-text-muted self-end mb-1">by Fintonlabs</span>
        </div>
        <nav className="relative z-10 flex items-center gap-3">
          {/* Fairlight-style page tabs */}
          <div className="flex gap-1 bg-grid-line p-1 rounded-lg">
            <Tooltipped tip="Create and edit patterns">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'editor'
                    ? 'bg-note-active text-grid-bg shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xs opacity-60">PAGE 1:</span>
                <Music className="w-4 h-4" />
                EDIT
              </button>
            </Tooltipped>
            <Tooltipped tip="Browse preset and saved patterns">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-note-active text-grid-bg shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xs opacity-60">PAGE 2:</span>
                <Library className="w-4 h-4" />
                BROWSE
              </button>
            </Tooltipped>
          </div>
                    <Tooltipped tip="Show product tour">
            <button
              onClick={() => {
                localStorage.removeItem('reach-for-lasers-tour-complete')
                setShowTour(true)
              }}
              className="p-2.5 rounded-lg bg-grid-line hover:bg-grid-bar transition-colors"
              aria-label="Show tour"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </Tooltipped>
          <Tooltipped tip="About Reach for the Lasers">
            <button
              onClick={() => setShowAbout(true)}
              className="p-2.5 rounded-lg bg-grid-line hover:bg-grid-bar transition-colors"
              aria-label="About"
            >
              <Info className="w-5 h-5 text-gray-400" />
            </button>
          </Tooltipped>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {activeTab === 'editor' ? (
          <div className="flex flex-col h-full">
            {/* Controls Bar */}
            <div className="flex items-center gap-6 px-6 py-4 border-b border-grid-line bg-grid-bg/70 backdrop-blur-sm">
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
                metronomeType={metronomeType}
                onMetronomeTypeChange={setMetronomeType}
                synthType={synthType}
                onSynthTypeChange={applyPreset}
                synthVolume={synthVolume}
                onSynthVolumeChange={setSynthVolume}
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
                <Tooltipped tip="Clear all notes from the pattern">
                  <button
                    onClick={clearPattern}
                    className="flex items-center gap-2 px-4 py-2 bg-grid-line text-gray-300 rounded-lg hover:bg-grid-bar transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </Tooltipped>
                <Tooltipped tip="Export pattern as MIDI or save to catalog">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-note-active text-grid-bg rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </Tooltipped>
              </div>
            </div>

            {/* Effects & Edit Bar */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-grid-line bg-grid-bg/60 backdrop-blur-sm">
              <Tooltipped tip={showEffects ? "Hide effects" : "Show effects"}>
                <button
                  onClick={() => setShowEffects(!showEffects)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    showEffects
                      ? 'bg-note-active/20 text-note-active'
                      : 'bg-grid-line text-gray-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm">FX</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showEffects ? 'rotate-90' : ''}`} />
                </button>
              </Tooltipped>
              {showEffects && (
                <>
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
                    reverbEnabled={reverbEnabled}
                    onReverbEnabledChange={setReverbEnabled}
                    reverbDecay={reverbDecay}
                    onReverbDecayChange={setReverbDecay}
                    reverbMix={reverbMix}
                    onReverbMixChange={setReverbMix}
                  />
                  <Tooltipped tip="Auto filter sweep over 16 bars (up then down)">
                    <button
                      onClick={triggerFilterSweep}
                      disabled={filterSweepActive}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                        filterSweepActive
                          ? 'bg-note-active text-grid-bg animate-pulse'
                          : 'bg-grid-line text-gray-400 hover:text-white hover:bg-grid-bar'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Auto Filter
                    </button>
                  </Tooltipped>
                </>
              )}
              {showEffects && <div className="w-px h-8 bg-grid-line" />}
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
                onNudgeLeft={nudgeLeft}
                onNudgeRight={nudgeRight}
                onTransposeUp={transposeUp}
                onTransposeDown={transposeDown}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>

            {/* Chord Track + Grid */}
            <div ref={scrollContainerRef} className="flex-1 overflow-auto grid-crosshair">
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
                theme="light"
                loopStartStep={loopStartStep}
                loopEndStep={loopEndStep}
                onLoopStartChange={setSelectionStart}
                onLoopEndChange={setSelectionEnd}
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
          soundSettings={{
            synthType,
            filterEnabled,
            filterType,
            filterFreq,
            filterQ,
            delayEnabled,
            delayTime,
            delayFeedback,
            delayMix,
            reverbEnabled,
            reverbDecay,
            reverbMix
          }}
          loopStart={selectionStart}
          loopEnd={selectionEnd}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* About Modal */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      {/* Product Tour */}
      {showTour && (
        <ProductTour onComplete={() => setShowTour(false)} />
      )}

      {/* Fairlight-style Status Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 border-t border-grid-line bg-grid-bg/90 text-xs">
        <div className="flex items-center gap-6 text-text-muted">
          <span>MEMORY: {pattern.notes.length.toString().padStart(3, '0')} NOTES</span>
          <span>|</span>
          <span>VOICE: {synthType.toUpperCase().replace(/-/g, ' ')}</span>
          <span>|</span>
          <span>SCALE: {SCALES[scale].name.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 text-note-active font-mono">
          <span>BAR {String(Math.floor(currentStep / STEPS_PER_BAR) + 1).padStart(2, '0')}</span>
          <span>:</span>
          <span>STEP {String((currentStep % STEPS_PER_BAR) + 1).padStart(2, '0')}</span>
          <span className="ml-4 text-text-muted">| {tempo} BPM</span>
        </div>
      </div>

      {/* Fairlight-style Function Key Bar */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-4 py-2 border-t border-grid-line bg-grid-bg text-xs">
        <button onClick={isPlaying ? stop : play} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color">
          <span className="text-text-muted">F1</span>
          <span className="text-note-active">{isPlaying ? 'STOP' : 'PLAY'}</span>
        </button>
        <button onClick={copySelection} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color">
          <span className="text-text-muted">F2</span>
          <span className="text-note-active">COPY</span>
        </button>
        <button onClick={pasteAtSelection} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color">
          <span className="text-text-muted">F3</span>
          <span className="text-note-active">PASTE</span>
        </button>
        <button onClick={clearSelection} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color">
          <span className="text-text-muted">F4</span>
          <span className="text-note-active">CLEAR</span>
        </button>
        <button onClick={undo} disabled={!canUndo} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color disabled:opacity-40">
          <span className="text-text-muted">F5</span>
          <span className="text-note-active">UNDO</span>
        </button>
        <button onClick={redo} disabled={!canRedo} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color disabled:opacity-40">
          <span className="text-text-muted">F6</span>
          <span className="text-note-active">REDO</span>
        </button>
        <button onClick={() => setShowExportModal(true)} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color">
          <span className="text-text-muted">F7</span>
          <span className="text-note-active">EXPORT</span>
        </button>
        <button onClick={() => setShowEffects(!showEffects)} className="flex items-center gap-1 px-3 py-1 bg-grid-line hover:bg-grid-bar rounded border border-border-color">
          <span className="text-text-muted">F8</span>
          <span className="text-note-active">FX</span>
        </button>
      </div>

      {/* Tooltip Bar */}
      <TooltipBar />
    </div>
    </TooltipProvider>
  )
}
