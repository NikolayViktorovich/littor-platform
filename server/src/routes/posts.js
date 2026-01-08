import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const offset = (page - 1) * limit

  const posts = db.prepare(`
    SELECT p.*, u.name as authorName, u.avatar as authorAvatar,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likesCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount,
      EXISTS(SELECT 1 FROM likes WHERE postId = p.id AND userId = ?) as isLiked
    FROM posts p
    JOIN users u ON p.authorId = u.id
    WHERE p.authorId = ? 
      OR p.authorId IN (
        SELECT CASE WHEN userId = ? THEN friendId ELSE userId END
        FROM friendships WHERE (userId = ? OR friendId = ?) AND status = 'accepted'
      )
    ORDER BY p.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, req.userId, req.userId, req.userId, req.userId, limit + 1, offset)

  const hasMore = posts.length > limit
  const result = posts.slice(0, limit).map(p => ({
    id: p.id,
    content: p.content,
    image: p.image,
    createdAt: p.createdAt,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    isLiked: !!p.isLiked,
    author: { id: p.authorId, name: p.authorName, avatar: p.authorAvatar }
  }))

  res.json({ posts: result, hasMore })
})

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  const { content } = req.body
  const image = req.file ? `/uploads/${req.file.filename}` : null

  if (!content?.trim() && !image) {
    return res.status(400).json({ error: 'Пост не может быть пустым' })
  }

  const id = uuid()
  db.prepare('INSERT INTO posts (id, authorId, content, image) VALUES (?, ?, ?, ?)')
    .run(id, req.userId, content?.trim() || null, image)

  const user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(req.userId)

  res.json({
    id,
    content: content?.trim() || null,
    image,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    author: user
  })
})

router.delete('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT authorId FROM posts WHERE id = ?').get(req.params.id)

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' })
  }

  if (post.authorId !== req.userId) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

router.post('/:id/like', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT 1 FROM likes WHERE userId = ? AND postId = ?')
    .get(req.userId, req.params.id)

  if (existing) {
    db.prepare('DELETE FROM likes WHERE userId = ? AND postId = ?')
      .run(req.userId, req.params.id)
  } else {
    db.prepare('INSERT INTO likes (userId, postId) VALUES (?, ?)')
      .run(req.userId, req.params.id)
  }

  const likesCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE postId = ?')
    .get(req.params.id).count

  res.json({ liked: !existing, likesCount })
})

router.get('/:id/comments', authMiddleware, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as authorName, u.avatar as authorAvatar
    FROM comments c
    JOIN users u ON c.authorId = u.id
    WHERE c.postId = ?
    ORDER BY c.createdAt ASC
  `).all(req.params.id)

  const result = comments.map(c => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: { id: c.authorId, name: c.authorName, avatar: c.authorAvatar }
  }))

  res.json(result)
})

router.post('/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Комментарий не может быть пустым' })
  }

  const id = uuid()
  db.prepare('INSERT INTO comments (id, postId, authorId, content) VALUES (?, ?, ?, ?)')
    .run(id, req.params.id, req.userId, content.trim())

  const user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(req.userId)

  res.json({
    id,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    author: user
  })
})

export default router
