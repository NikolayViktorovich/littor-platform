import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req, res) => {
  const friends = db.prepare(`
    SELECT u.id, u.name, u.avatar
    FROM users u
    JOIN friendships f ON (f.userId = u.id OR f.friendId = u.id)
    WHERE (f.userId = ? OR f.friendId = ?) 
      AND f.status = 'accepted'
      AND u.id != ?
  `).all(req.userId, req.userId, req.userId)

  res.json(friends)
})

router.get('/incoming', authMiddleware, (req, res) => {
  const requests = db.prepare(`
    SELECT u.id, u.name, u.avatar
    FROM users u
    JOIN friendships f ON f.userId = u.id
    WHERE f.friendId = ? AND f.status = 'pending'
  `).all(req.userId)

  res.json(requests)
})

router.get('/outgoing', authMiddleware, (req, res) => {
  const requests = db.prepare(`
    SELECT u.id, u.name, u.avatar
    FROM users u
    JOIN friendships f ON f.friendId = u.id
    WHERE f.userId = ? AND f.status = 'pending'
  `).all(req.userId)

  res.json(requests)
})

router.post('/request/:id', authMiddleware, (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'Нельзя добавить себя в друзья' })
  }

  const existing = db.prepare(`
    SELECT * FROM friendships 
    WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)
  `).get(req.userId, req.params.id, req.params.id, req.userId)

  if (existing) {
    return res.status(400).json({ error: 'Заявка уже существует' })
  }

  db.prepare('INSERT INTO friendships (userId, friendId, status) VALUES (?, ?, ?)')
    .run(req.userId, req.params.id, 'pending')

  res.json({ success: true })
})

router.post('/accept/:id', authMiddleware, (req, res) => {
  try {
    db.prepare(`
      UPDATE friendships SET status = 'accepted'
      WHERE userId = ? AND friendId = ? AND status = 'pending'
    `).run(req.params.id, req.userId)

    res.json({ success: true })
  } catch (err) {
    console.error('Error accepting friend:', err)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

router.post('/decline/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ? AND status = ?')
    .run(req.params.id, req.userId, 'pending')

  res.json({ success: true })
})

router.delete('/request/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ? AND status = ?')
    .run(req.userId, req.params.id, 'pending')

  res.json({ success: true })
})

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare(`
    DELETE FROM friendships 
    WHERE ((userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?))
      AND status = 'accepted'
  `).run(req.userId, req.params.id, req.params.id, req.userId)

  res.json({ success: true })
})

export default router
