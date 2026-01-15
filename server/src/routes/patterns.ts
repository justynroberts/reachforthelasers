import { Router } from 'express'
import { z } from 'zod'
import * as db from '../db/queries.js'
import { savePatternLimiter } from '../middleware/rateLimit.js'

export const patternsRouter = Router()

// Validation schemas
const NoteSchema = z.object({
  step: z.number().int().min(0).max(255),
  pitch: z.number().int().min(0),
  velocity: z.number().int().min(0).max(127),
  length: z.number().int().min(1).max(16),
  accent: z.boolean()
})

const ScaleTypeSchema = z.enum([
  'major', 'minor', 'harmonicMinor', 'melodicMinor',
  'dorian', 'phrygian', 'phrygianDominant', 'lydian',
  'mixolydian', 'wholeTone', 'diminished',
  'pentatonicMajor', 'pentatonicMinor', 'blues'
])

const TagSchema = z.enum([
  'Uplifting', 'Progressive', 'Psytrance', 'Tech-Trance', 'Goa',
  'Lead', 'Bass', 'Arp', 'Pad-Rhythm', 'FX',
  'Simple', 'Complex', 'Rolling', 'Sparse', 'Melodic'
])

const CreatePatternSchema = z.object({
  description: z.string().min(10).max(500),
  name: z.string().max(100).optional(),
  notes: z.array(NoteSchema).min(1).max(1000),
  scale: ScaleTypeSchema,
  rootNote: z.number().int().min(0).max(127),
  tempo: z.number().int().min(120).max(160),
  tags: z.array(TagSchema).max(5).default([])
})

const QuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['newest', 'mostLoaded', 'random']).default('newest'),
  tags: z.string().optional(), // Comma-separated
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

// GET /api/patterns - List patterns
patternsRouter.get('/', async (req, res, next) => {
  try {
    const query = QuerySchema.parse(req.query)
    const tags = query.tags ? query.tags.split(',') as z.infer<typeof TagSchema>[] : undefined

    const patterns = await db.getPatterns({
      search: query.search,
      sort: query.sort,
      tags,
      limit: query.limit,
      offset: query.offset
    })

    res.json({ patterns })
  } catch (err) {
    next(err)
  }
})

// GET /api/patterns/:id - Get single pattern
patternsRouter.get('/:id', async (req, res, next) => {
  try {
    const pattern = await db.getPatternById(req.params.id)

    if (!pattern) {
      res.status(404).json({ error: 'Pattern not found' })
      return
    }

    res.json(pattern)
  } catch (err) {
    next(err)
  }
})

// POST /api/patterns - Create pattern
patternsRouter.post('/', savePatternLimiter, async (req, res, next) => {
  try {
    const data = CreatePatternSchema.parse(req.body)

    // Generate name if not provided
    const name = data.name || `${data.scale} #${Date.now().toString(36)}`

    const pattern = await db.createPattern({
      ...data,
      name
    })

    res.status(201).json(pattern)
  } catch (err) {
    next(err)
  }
})

// POST /api/patterns/:id/load - Increment load count
patternsRouter.post('/:id/load', async (req, res, next) => {
  try {
    await db.incrementLoadCount(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})
