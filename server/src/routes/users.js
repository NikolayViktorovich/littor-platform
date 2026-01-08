import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/search', authMiddleware, (req, res) => {
  const { q } = req.query
  if (!q?.trim()) {
    return res.json([])
  }

  const query = `%${q.trim().toLowerCase()}%`
  const users = db.prepare(`
    SELECT id, name, avatar, email
    FROM users
    WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?
    LIMIT 20
  `).all(query, query)

  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    username: u.email.split('@')[0]
  })))
})

router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT id, name, avatar, bio, cover, lastSeen,
      (SELECT COUNT(*) FROM friendships WHERE (userId = ? OR friendId = ?) AND status = 'accepted') as friendsCount,
      (SELECT COUNT(*) FROM posts WHERE authorId = ?) as postsCount
    FROM users WHERE id = ?
  `).get(req.params.id, req.params.id, req.params.id, req.params.id)

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  let friendStatus = 'none'
  if (req.userId !== req.params.id) {
    const friendship = db.prepare(`
      SELECT * FROM friendships 
      WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)
    `).get(req.userId, req.params.id, req.params.id, req.userId)

    if (friendship) {
      if (friendship.status === 'accepted') {
        friendStatus = 'friends'
      } else if (friendship.userId === req.userId) {
        friendStatus = 'pending'
      } else {
        friendStatus = 'incoming'
      }
    }
  }

  // Check if online (last seen within 5 minutes)
  const isOnline = user.lastSeen && (Date.now() - new Date(user.lastSeen).getTime()) < 300000

  res.json({ ...user, friendStatus, isOnline })
})

router.get('/:id/posts', authMiddleware, (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.name as authorName, u.avatar as authorAvatar,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likesCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount,
      EXISTS(SELECT 1 FROM likes WHERE postId = p.id AND userId = ?) as isLiked
    FROM posts p
    JOIN users u ON p.authorId = u.id
    WHERE p.authorId = ?
    ORDER BY p.createdAt DESC
  `).all(req.userId, req.params.id)

  const result = posts.map(p => ({
    id: p.id,
    content: p.content,
    image: p.image,
    createdAt: p.createdAt,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    isLiked: !!p.isLiked,
    author: { id: p.authorId, name: p.authorName, avatar: p.authorAvatar }
  }))

  res.json(result)
})

router.put('/profile', authMiddleware, (req, res) => {
  const { name, bio } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Имя обязательно' })
  }

  db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?')
    .run(name.trim(), bio?.trim() || null, req.userId)

  res.json({ name: name.trim(), bio: bio?.trim() || null })
})

router.post('/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' })
  }

  const avatar = `/uploads/${req.file.filename}`
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.userId)

  res.json({ avatar })
})

router.post('/cover', authMiddleware, upload.single('cover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' })
  }

  const cover = `/uploads/${req.file.filename}`
  db.prepare('UPDATE users SET cover = ? WHERE id = ?').run(cover, req.userId)

  res.json({ cover })
})

router.post('/heartbeat', authMiddleware, (req, res) => {
  db.prepare('UPDATE users SET lastSeen = ? WHERE id = ?')
    .run(new Date().toISOString(), req.userId)
  res.json({ success: true })
})

router.get('/:id/photos', authMiddleware, (req, res) => {
  const photos = db.prepare(`
    SELECT id, image, createdAt FROM posts 
    WHERE authorId = ? AND image IS NOT NULL 
    AND (image LIKE '%.jpg' OR image LIKE '%.jpeg' OR image LIKE '%.png' OR image LIKE '%.gif' OR image LIKE '%.webp')
    ORDER BY createdAt DESC
  `).all(req.params.id)
  res.json(photos)
})

router.get('/:id/videos', authMiddleware, (req, res) => {
  const videos = db.prepare(`
    SELECT id, image as video, createdAt FROM posts 
    WHERE authorId = ? AND image IS NOT NULL 
    AND (image LIKE '%.mp4' OR image LIKE '%.webm' OR image LIKE '%.mov')
    ORDER BY createdAt DESC
  `).all(req.params.id)
  res.json(videos)
})

router.get('/:id/friends', authMiddleware, (req, res) => {
  const friends = db.prepare(`
    SELECT u.id, u.name, u.avatar
    FROM users u
    JOIN friendships f ON (f.userId = u.id OR f.friendId = u.id)
    WHERE (f.userId = ? OR f.friendId = ?) 
      AND f.status = 'accepted'
      AND u.id != ?
  `).all(req.params.id, req.params.id, req.params.id)
  res.json(friends)
})

export default router
