import type { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Error:', err)

  if (err.name === 'ZodError') {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors
    })
    return
  }

  res.status(500).json({
    error: 'Internal server error'
  })
}
