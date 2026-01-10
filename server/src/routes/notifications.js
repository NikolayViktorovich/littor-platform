import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req, res) => {
  const notifications = db.prepare(`
    SELECT n.*, u.name as fromUserName, u.avatar as fromUserAvatar
    FROM notifications n
    LEFT JOIN users u ON n.fromUserId = u.id
    WHERE n.userId = ?
    ORDER BY n.createdAt DESC
    LIMIT 50
  `).all(req.userId)

  res.json(notifications)
})

router.get('/unread-count', authMiddleware, (req, res) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0')
    .get(req.userId)
  res.json({ count: result?.count || 0 })
})

router.post('/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(req.userId)
  res.json({ success: true })
})

router.post('/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?')
    .run(req.params.id, req.userId)
  res.json({ success: true })
})

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ? AND userId = ?')
    .run(req.params.id, req.userId)
  res.json({ success: true })
})

export default router
