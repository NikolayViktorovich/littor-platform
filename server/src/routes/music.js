import { Router } from 'express'
import { prepare } from '../db.js'
import { v4 as uuid } from 'uuid'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const DEEZER_API = 'https://api.deezer.com'

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query
    if (!q) return res.status(400).json({ error: 'Query required' })
    
    const response = await fetch(`${DEEZER_API}/search?q=${encodeURIComponent(q)}&limit=${limit}`)
    const data = await response.json()
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message })
    }
    
    const tracks = data.data?.map(track => ({
      id: String(track.id),
      title: track.title,
      artist: track.artist?.name || 'Unknown',
      artwork: track.album?.cover_medium || track.album?.cover || null,
      duration: track.duration,
      preview: track.preview
    })) || []
    
    res.json(tracks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/trending', authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const response = await fetch(`${DEEZER_API}/chart/0/tracks?limit=${limit}`)
    const data = await response.json()
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message })
    }
    
    const tracks = data.data?.map(track => ({
      id: String(track.id),
      title: track.title,
      artist: track.artist?.name || 'Unknown',
      artwork: track.album?.cover_medium || track.album?.cover || null,
      duration: track.duration,
      preview: track.preview
    })) || []
    
    res.json(tracks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/track/:id', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${DEEZER_API}/track/${req.params.id}`)
    const track = await response.json()
    
    if (track.error) {
      return res.status(404).json({ error: 'Track not found' })
    }
    
    res.json({
      id: String(track.id),
      title: track.title,
      artist: track.artist?.name || 'Unknown',
      artwork: track.album?.cover_medium || track.album?.cover || null,
      duration: track.duration,
      preview: track.preview
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/stream/:id', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${DEEZER_API}/track/${req.params.id}`)
    const track = await response.json()
    
    if (track.error || !track.preview) {
      return res.status(404).json({ error: 'Stream not available' })
    }
    
    res.json({ url: track.preview })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/library', authMiddleware, (req, res) => {
  const tracks = prepare(`
    SELECT * FROM user_tracks WHERE userId = ? ORDER BY createdAt DESC
  `).all(req.userId)
  res.json(tracks)
})

router.post('/library', authMiddleware, (req, res) => {
  const { trackId, title, artist, artwork, duration } = req.body
  if (!trackId || !title) return res.status(400).json({ error: 'Track data required' })
  
  const existing = prepare(`SELECT id FROM user_tracks WHERE userId = ? AND trackId = ?`).get(req.userId, trackId)
  if (existing) return res.status(400).json({ error: 'Track already in library' })
  
  const id = uuid()
  prepare(`
    INSERT INTO user_tracks (id, userId, trackId, title, artist, artwork, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, trackId, title, artist || '', artwork || null, duration || 0)
  
  res.json({ id, trackId, title, artist, artwork, duration })
})

router.delete('/library/:trackId', authMiddleware, (req, res) => {
  prepare(`DELETE FROM user_tracks WHERE userId = ? AND trackId = ?`).run(req.userId, req.params.trackId)
  res.json({ success: true })
})

router.get('/history', authMiddleware, (req, res) => {
  const tracks = prepare(`
    SELECT * FROM listening_history WHERE userId = ? ORDER BY playedAt DESC LIMIT 50
  `).all(req.userId)
  res.json(tracks)
})

router.post('/history', authMiddleware, (req, res) => {
  const { trackId, title, artist, artwork, duration } = req.body
  if (!trackId || !title) return res.status(400).json({ error: 'Track data required' })
  
  const id = uuid()
  prepare(`
    INSERT INTO listening_history (id, userId, trackId, title, artist, artwork, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, trackId, title, artist || '', artwork || null, duration || 0)
  
  res.json({ success: true })
})

router.get('/user/:userId', authMiddleware, (req, res) => {
  const tracks = prepare(`
    SELECT * FROM user_tracks WHERE userId = ? ORDER BY createdAt DESC
  `).all(req.params.userId)
  res.json(tracks)
})

router.get('/user/:userId/history', authMiddleware, (req, res) => {
  const tracks = prepare(`
    SELECT * FROM listening_history WHERE userId = ? ORDER BY playedAt DESC LIMIT 50
  `).all(req.params.userId)
  res.json(tracks)
})

export default router
