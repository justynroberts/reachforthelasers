import { X, ExternalLink, Coffee } from 'lucide-react'

interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-grid-bg border border-grid-line rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-white mb-2">Reach for the Lasers</h2>
          <p className="text-gray-400 text-sm mb-6">
            Browser-based trance pattern generator
          </p>

          <div className="bg-grid-line/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-2">Built by</p>
            <a
              href="https://www.fintonlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-note-active hover:underline font-medium"
            >
              Fintonlabs
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <a
            href="https://www.buymeacoffee.com/justynrobeu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FFDD00] text-black rounded-lg hover:opacity-90 transition-opacity font-medium"
            style={{ fontFamily: 'Cookie, cursive' }}
          >
            <Coffee className="w-5 h-5" />
            Buy me a coffee
          </a>
        </div>
      </div>
    </div>
  )
}
