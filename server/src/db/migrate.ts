import { pool } from './pool.js'

async function migrate() {
  console.log('Running migrations...')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patterns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      notes JSONB NOT NULL,
      scale VARCHAR(50) NOT NULL,
      root_note INTEGER NOT NULL,
      tempo INTEGER NOT NULL,
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      load_count INTEGER DEFAULT 0
    )
  `)

  // Create index for full-text search
  await pool.query(`
    CREATE INDEX IF NOT EXISTS patterns_description_search_idx
    ON patterns USING gin(to_tsvector('english', description))
  `)

  // Create index for tags
  await pool.query(`
    CREATE INDEX IF NOT EXISTS patterns_tags_idx
    ON patterns USING gin(tags)
  `)

  // Create index for sorting
  await pool.query(`
    CREATE INDEX IF NOT EXISTS patterns_created_at_idx
    ON patterns(created_at DESC)
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS patterns_load_count_idx
    ON patterns(load_count DESC)
  `)

  console.log('Migrations complete!')
  await pool.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
