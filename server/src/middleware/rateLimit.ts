import rateLimit from 'express-rate-limit'

// Rate limiter for saving patterns: 20 per day per IP
export const savePatternLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20,
  message: {
    error: 'Too many patterns saved today. Try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
