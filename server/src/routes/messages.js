import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/dialogs', authMiddleware, (req, res) => {
  const dialogs = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar,
      m.id as messageId, m.content, m.senderId, m.createdAt, m.mediaType,
      (SELECT COUNT(*) FROM messages 
       WHERE senderId = u.id AND receiverId = ? AND isRead = 0) as unreadCount
    FROM users u
    JOIN messages m ON m.id = (
      SELECT id FROM messages 
      WHERE (senderId = u.id AND receiverId = ?) OR (senderId = ? AND receiverId = u.id)
      ORDER BY createdAt DESC LIMIT 1
    )
    WHERE u.id != ?
    ORDER BY m.createdAt DESC
  `).all(req.userId, req.userId, req.userId, req.userId)

  const result = dialogs.map(d => ({
    user: { id: d.id, name: d.name, avatar: d.avatar },
    lastMessage: { 
      id: d.messageId, 
      content: d.content || getMediaPreview(d.mediaType), 
      senderId: d.senderId, 
      createdAt: d.createdAt 
    },
    unreadCount: d.unreadCount
  }))

  res.json(result)
})

function getMediaPreview(mediaType) {
  if (!mediaType) return ''
  if (mediaType === 'image') return '📷 Фото'
  if (mediaType === 'video') return '🎬 Видео'
  if (mediaType === 'voice') return '🎤 Голосовое сообщение'
  if (mediaType === 'circle') return '⭕ Видеосообщение'
  return ''
}

router.get('/unread-count', authMiddleware, (req, res) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiverId = ? AND isRead = 0')
    .get(req.userId)

  res.json({ count: result.count })
})

router.get('/:id', authMiddleware, (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
    ORDER BY createdAt ASC
  `).all(req.userId, req.params.id, req.params.id, req.userId)

  res.json(messages)
})

router.post('/:id', authMiddleware, upload.single('media'), (req, res) => {
  try {
    const { content, mediaType } = req.body
    const media = req.file ? `/uploads/${req.file.filename}` : null

    if (!content?.trim() && !media) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    const id = uuid()
    const createdAt = new Date().toISOString()
    const messageContent = content?.trim() || null

    db.prepare('INSERT INTO messages (id, senderId, receiverId, content, media, mediaType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, req.params.id, messageContent, media, mediaType || null, createdAt)

    res.json({
      id,
      senderId: req.userId,
      receiverId: req.params.id,
      content: messageContent,
      media,
      mediaType: mediaType || null,
      isRead: 0,
      createdAt
    })
  } catch (err) {
    console.error('Error sending message:', err)
    res.status(500).json({ error: 'Ошибка отправки сообщения' })
  }
})

router.post('/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ?')
    .run(req.params.id, req.userId)

  res.json({ success: true })
})

export default router
