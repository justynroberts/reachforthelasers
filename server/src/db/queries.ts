import { pool } from './pool.js'

export interface Note {
  step: number
  pitch: number
  velocity: number
  length: number
  accent: boolean
}

export interface CatalogPattern {
  id: string
  name: string
  description: string
  notes: Note[]
  scale: string
  rootNote: number
  tempo: number
  tags: string[]
  createdAt: string
  loadCount: number
}

interface GetPatternsOptions {
  search?: string
  sort: 'newest' | 'mostLoaded' | 'random'
  tags?: string[]
  limit: number
  offset: number
}

export async function getPatterns(options: GetPatternsOptions): Promise<CatalogPattern[]> {
  const { search, sort, tags, limit, offset } = options

  let query = `
    SELECT
      id, name, description, notes, scale, root_note as "rootNote",
      tempo, tags, created_at as "createdAt", load_count as "loadCount"
    FROM patterns
    WHERE 1=1
  `
  const params: (string | number | string[])[] = []
  let paramIndex = 1

  // Search filter (full-text search on description and name)
  if (search) {
    query += ` AND (
      to_tsvector('english', description) @@ plainto_tsquery('english', $${paramIndex})
      OR name ILIKE $${paramIndex + 1}
    )`
    params.push(search, `%${search}%`)
    paramIndex += 2
  }

  // Tags filter
  if (tags && tags.length > 0) {
    query += ` AND tags && $${paramIndex}::text[]`
    params.push(tags)
    paramIndex++
  }

  // Sort
  switch (sort) {
    case 'newest':
      query += ' ORDER BY created_at DESC'
      break
    case 'mostLoaded':
      query += ' ORDER BY load_count DESC, created_at DESC'
      break
    case 'random':
      query += ' ORDER BY RANDOM()'
      break
  }

  // Pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export async function getPatternById(id: string): Promise<CatalogPattern | null> {
  const result = await pool.query(
    `SELECT
      id, name, description, notes, scale, root_note as "rootNote",
      tempo, tags, created_at as "createdAt", load_count as "loadCount"
    FROM patterns
    WHERE id = $1`,
    [id]
  )

  return result.rows[0] || null
}

interface CreatePatternData {
  name: string
  description: string
  notes: Note[]
  scale: string
  rootNote: number
  tempo: number
  tags: string[]
}

export async function createPattern(data: CreatePatternData): Promise<CatalogPattern> {
  const result = await pool.query(
    `INSERT INTO patterns (name, description, notes, scale, root_note, tempo, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id, name, description, notes, scale, root_note as "rootNote",
       tempo, tags, created_at as "createdAt", load_count as "loadCount"`,
    [
      data.name,
      data.description,
      JSON.stringify(data.notes),
      data.scale,
      data.rootNote,
      data.tempo,
      data.tags
    ]
  )

  return result.rows[0]
}

export async function incrementLoadCount(id: string): Promise<void> {
  await pool.query(
    'UPDATE patterns SET load_count = load_count + 1 WHERE id = $1',
    [id]
  )
}
