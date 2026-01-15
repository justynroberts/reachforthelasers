import { pool } from './pool.js'

// Sample patterns to seed the database
const samplePatterns = [
  {
    name: 'Uplifting Anthem',
    description: 'Classic uplifting trance arp with octave jumps, perfect for main room anthems',
    notes: generateClassicUplifter(),
    scale: 'harmonicMinor',
    rootNote: 57, // A3
    tempo: 138,
    tags: ['Uplifting', 'Lead', 'Melodic']
  },
  {
    name: 'Psy Roller',
    description: 'Rolling psytrance lead with subtle pitch variations, great for hypnotic sections',
    notes: generatePsyRoller(),
    scale: 'phrygianDominant',
    rootNote: 52, // E3
    tempo: 145,
    tags: ['Psytrance', 'Lead', 'Rolling']
  },
  {
    name: 'Progressive Groove',
    description: 'Sparse progressive pattern with space for pads, works well in breakdowns',
    notes: generateProgressiveGroove(),
    scale: 'minor',
    rootNote: 55, // G3
    tempo: 128,
    tags: ['Progressive', 'Sparse', 'Lead']
  }
]

function generateClassicUplifter() {
  const notes = []
  for (let bar = 0; bar < 16; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const step = bar * 16 + beat * 4
      const basePitch = (bar % 2) * 7
      notes.push({ step, pitch: basePitch, velocity: 100, length: 1, accent: beat === 0 })
      notes.push({ step: step + 1, pitch: basePitch + 2, velocity: 90, length: 1, accent: false })
      notes.push({ step: step + 2, pitch: basePitch + 4, velocity: 90, length: 1, accent: false })
      notes.push({ step: step + 3, pitch: basePitch + 7, velocity: 95, length: 1, accent: false })
    }
  }
  return notes
}

function generatePsyRoller() {
  const notes = []
  for (let bar = 0; bar < 16; bar++) {
    for (let i = 0; i < 16; i++) {
      const step = bar * 16 + i
      const pitch = (i + bar) % 4
      notes.push({
        step,
        pitch,
        velocity: 85 + (i % 4 === 0 ? 20 : 0),
        length: 1,
        accent: i === 0
      })
    }
  }
  return notes
}

function generateProgressiveGroove() {
  const notes = []
  const hitPattern = [0, 6, 10, 12]
  for (let bar = 0; bar < 16; bar++) {
    for (const hit of hitPattern) {
      if (bar % 2 === 1 && hit === 6) continue
      notes.push({
        step: bar * 16 + hit,
        pitch: (bar % 4) * 2,
        velocity: hit === 0 ? 100 : 85,
        length: 2,
        accent: hit === 0
      })
    }
  }
  return notes
}

async function seed() {
  console.log('Seeding database...')

  for (const pattern of samplePatterns) {
    await pool.query(
      `INSERT INTO patterns (name, description, notes, scale, root_note, tempo, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        pattern.name,
        pattern.description,
        JSON.stringify(pattern.notes),
        pattern.scale,
        pattern.rootNote,
        pattern.tempo,
        pattern.tags
      ]
    )
    console.log(`Seeded: ${pattern.name}`)
  }

  console.log('Seeding complete!')
  await pool.end()
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
