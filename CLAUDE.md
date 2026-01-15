# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reach for the Lasers is a browser-based trance lead pattern generator. Users create 16-bar melodic sequences on a grid constrained to musical scales, audition them with Tone.js, and export as MIDI. All patterns are saved to a shared community catalog - no accounts, no ownership.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Audio**: Tone.js for Web Audio playback
- **MIDI**: jsmidgen or @tonejs/midi for MIDI file export
- **Monorepo**: npm workspaces

## Project Structure

```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Grid/       # Pattern grid editor
│   │   │   ├── Transport/  # Play/stop/tempo controls
│   │   │   ├── ScaleSelector/
│   │   │   ├── Catalog/    # Pattern browser
│   │   │   └── Export/     # MIDI export modal
│   │   ├── hooks/          # Custom React hooks
│   │   ├── audio/          # Tone.js integration
│   │   ├── scales/         # Scale definitions and utilities
│   │   ├── presets/        # Built-in arpeggio patterns
│   │   └── types/          # TypeScript types
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── db/             # Database queries and migrations
│   │   └── middleware/     # Rate limiting, validation
│   └── package.json
├── shared/                 # Shared types between client/server
└── package.json            # Root workspace config
```

## Commands

### Development
```bash
npm install              # Install all dependencies
npm run dev              # Start both client (5173) and server (3001)
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend
```

### Building
```bash
npm run build            # Build both client and server
npm run build:client     # Build frontend only
npm run build:server     # Build backend only
```

### Testing
```bash
npm test                 # Run all tests
npm run test:client      # Frontend tests (Vitest)
npm run test:server      # Backend tests
```

### Database
```bash
npm run db:migrate       # Run migrations
npm run db:seed          # Seed with preset patterns
```

### Linting
```bash
npm run lint             # Lint all packages
npm run lint:fix         # Fix auto-fixable issues
```

## Architecture Notes

### Grid Data Model
The pattern grid is a sparse representation - only active notes are stored:
```typescript
interface Note {
  step: number;      // 0-255 (16 bars × 16 steps)
  pitch: number;     // Scale degree index (0 = root)
  velocity: number;  // 0-127
  length: number;    // In steps (1 = 1/16, 2 = 1/8, 4 = 1/4)
  accent: boolean;
}

interface Pattern {
  notes: Note[];
  scale: ScaleType;
  rootNote: number;  // MIDI note number (60 = middle C)
  tempo: number;     // BPM
}
```

### Scale System
Scales are defined as arrays of semitone intervals from root. The grid's vertical axis maps to scale degrees, not chromatic pitches. When scale changes, existing notes snap to nearest scale degree.

### Audio Engine
Tone.js Transport handles sequencing. A Tone.Sequence triggers notes at each 16th. Preview synth is a simple PolySynth - deliberately basic since users export to their DAW for final sound.

### Catalog API
- `GET /api/patterns` - List patterns (with search, filter, sort, pagination)
- `GET /api/patterns/:id` - Get single pattern
- `POST /api/patterns` - Save new pattern (rate limited: 20/day per IP)
- `POST /api/patterns/:id/load` - Increment load count

### Key Constraints
- 🔴 Grid must maintain 60fps during playback with 256 steps visible
- 🔴 Audio latency under 50ms (use Tone.js lookahead scheduling)
- 🟡 Pattern catalog search should handle 10,000+ patterns efficiently (PostgreSQL full-text search)
- 🟢 No user accounts - patterns are anonymous and shared
- 🟢 No localStorage for patterns - catalog is the only persistence
