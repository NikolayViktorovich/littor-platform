import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

function parseMedia(mediaJson) {
  if (!mediaJson) return []
  try {
    const items = JSON.parse(mediaJson)
    return items.map(item => ({
      url: item.url,
      mediaType: item.type,
      fileName: item.name,
      fileSize: item.size
    }))
  } catch {
    return []
  }
}

function mapPost(p) {
  const media = parseMedia(p.media)
  return {
    id: p.id,
    content: p.content,
    image: p.image,
    media,
    mediaType: media.length > 0 ? media[0].mediaType : null,
    musicTrackId: p.musicTrackId,
    musicTitle: p.musicTitle,
    musicArtist: p.musicArtist,
    musicArtwork: p.musicArtwork,
    createdAt: p.createdAt,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    isLiked: !!p.isLiked,
    isPinned: !!p.isPinned,
    isArchived: !!p.isArchived,
    commentsDisabled: !!p.commentsDisabled,
    author: { id: p.authorId, name: p.authorName, avatar: p.authorAvatar }
  }
}

router.get('/archived', authMiddleware, (req, res) => {
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
    WHERE p.isArchived = 1 AND p.authorId = ?
    ORDER BY p.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, req.userId, limit + 1, offset)

  const hasMore = posts.length > limit
  const result = posts.slice(0, limit).map(mapPost)

  res.json({ posts: result, hasMore })
})

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
    WHERE (p.isArchived = 0 OR p.isArchived IS NULL)
      AND (p.authorId = ? 
        OR p.authorId IN (
          SELECT CASE WHEN userId = ? THEN friendId ELSE userId END
          FROM friendships WHERE (userId = ? OR friendId = ?) AND status = 'accepted'
        ))
    ORDER BY p.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, req.userId, req.userId, req.userId, req.userId, limit + 1, offset)

  const hasMore = posts.length > limit
  const result = posts.slice(0, limit).map(mapPost)

  res.json({ posts: result, hasMore })
})

router.post('/', authMiddleware, upload.array('media', 10), (req, res) => {
  const { content, musicTrackId, musicTitle, musicArtist, musicArtwork, filesMeta } = req.body
  const files = req.files || []
  
  let parsedFilesMeta = []
  if (filesMeta) {
    try { parsedFilesMeta = JSON.parse(filesMeta) } catch {}
  }
  
  const mediaArray = files.map((f, i) => ({
    url: `/uploads/${f.filename}`,
    mediaType: getMediaType(f.mimetype),
    fileName: parsedFilesMeta[i]?.name || f.originalname,
    fileSize: parsedFilesMeta[i]?.size || f.size
  }))
  const mediaJson = mediaArray.length > 0 ? JSON.stringify(mediaArray.map(m => ({ url: m.url, type: m.mediaType, name: m.fileName, size: m.fileSize }))) : null
  const image = files.length > 0 ? `/uploads/${files[0].filename}` : null

  if (!content?.trim() && !mediaJson && !musicTrackId) {
    return res.status(400).json({ error: 'Пост не может быть пустым' })
  }

  const id = uuid()
  db.prepare(`
    INSERT INTO posts (id, authorId, content, image, media, musicTrackId, musicTitle, musicArtist, musicArtwork)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, content?.trim() || null, image, mediaJson, musicTrackId || null, musicTitle || null, musicArtist || null, musicArtwork || null)

  const user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(req.userId)

  const post = {
    id,
    content: content?.trim() || null,
    image,
    media: mediaArray,
    mediaType: mediaArray.length > 0 ? mediaArray[0].mediaType : null,
    musicTrackId: musicTrackId || null,
    musicTitle: musicTitle || null,
    musicArtist: musicArtist || null,
    musicArtwork: musicArtwork || null,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    author: user
  }

  const io = req.app.get('io')
  const friends = db.prepare(`
    SELECT CASE WHEN userId = ? THEN friendId ELSE userId END as friendId
    FROM friendships WHERE (userId = ? OR friendId = ?) AND status = 'accepted'
  `).all(req.userId, req.userId, req.userId)
  
  friends.forEach(f => {
    io.to(`user:${f.friendId}`).emit('post:new', post)
  })

  res.json(post)
})

function getMediaType(mimetype) {
  if (mimetype.startsWith('image/gif')) return 'gif'
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype.startsWith('audio/')) return 'audio'
  return 'file'
}

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

router.post('/:id/pin', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT authorId, isPinned FROM posts WHERE id = ?').get(req.params.id)

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' })
  }

  if (post.authorId !== req.userId) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const newPinned = post.isPinned ? 0 : 1
  
  if (newPinned) {
    db.prepare('UPDATE posts SET isPinned = 0 WHERE authorId = ?').run(req.userId)
  }
  
  db.prepare('UPDATE posts SET isPinned = ? WHERE id = ?').run(newPinned, req.params.id)
  
  res.json({ isPinned: !!newPinned })
})

router.post('/:id/archive', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT authorId, isArchived FROM posts WHERE id = ?').get(req.params.id)

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' })
  }

  if (post.authorId !== req.userId) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const newArchived = post.isArchived ? 0 : 1
  db.prepare('UPDATE posts SET isArchived = ? WHERE id = ?').run(newArchived, req.params.id)
  
  res.json({ isArchived: !!newArchived })
})

router.post('/:id/comments-toggle', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT authorId, commentsDisabled FROM posts WHERE id = ?').get(req.params.id)

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' })
  }

  if (post.authorId !== req.userId) {
    return res.status(403).json({ error: 'Нет доступа' })
  }

  const newDisabled = post.commentsDisabled ? 0 : 1
  db.prepare('UPDATE posts SET commentsDisabled = ? WHERE id = ?').run(newDisabled, req.params.id)
  
  res.json({ commentsDisabled: !!newDisabled })
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

  const io = req.app.get('io')
  io.to(`post:${req.params.id}`).emit('post:like', {
    postId: req.params.id,
    liked: !existing,
    likesCount,
    userId: req.userId
  })

  res.json({ liked: !existing, likesCount })
})

router.get('/:id/comments', authMiddleware, (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.name as authorName, u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM comment_likes WHERE commentId = c.id) as likesCount,
        EXISTS(SELECT 1 FROM comment_likes WHERE commentId = c.id AND userId = ?) as isLiked
      FROM comments c
      JOIN users u ON c.authorId = u.id
      WHERE c.postId = ? AND c.parentId IS NULL
      ORDER BY c.createdAt ASC
    `).all(req.userId, req.params.id)

    const result = comments.map(c => {
      const replies = db.prepare(`
        SELECT r.*, u.name as authorName, u.avatar as authorAvatar,
          (SELECT COUNT(*) FROM comment_likes WHERE commentId = r.id) as likesCount,
          EXISTS(SELECT 1 FROM comment_likes WHERE commentId = r.id AND userId = ?) as isLiked
        FROM comments r
        JOIN users u ON r.authorId = u.id
        WHERE r.parentId = ?
        ORDER BY r.createdAt ASC
      `).all(req.userId, c.id)

      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        likesCount: c.likesCount || 0,
        isLiked: !!c.isLiked,
        author: { id: c.authorId, name: c.authorName, avatar: c.authorAvatar },
        replies: replies.map(r => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
          likesCount: r.likesCount || 0,
          isLiked: !!r.isLiked,
          author: { id: r.authorId, name: r.authorName, avatar: r.authorAvatar }
        }))
      }
    })

    res.json(result)
  } catch (err) {
    console.error('Error loading comments:', err)
    res.status(500).json({ error: 'Ошибка загрузки комментариев' })
  }
})

router.post('/:id/comments', authMiddleware, (req, res) => {
  const { content, parentId } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Комментарий не может быть пустым' })
  }

  try {
    const id = uuid()
    const createdAt = new Date().toISOString()
    
    db.prepare('INSERT INTO comments (id, postId, authorId, content, parentId, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.params.id, req.userId, content.trim(), parentId || null, createdAt)

    const user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(req.userId)

    const comment = {
      id,
      content: content.trim(),
      createdAt,
      likesCount: 0,
      isLiked: false,
      author: user,
      parentId: parentId || null,
      replies: []
    }

    const io = req.app.get('io')
    io.to(`post:${req.params.id}`).emit('post:comment', {
      postId: req.params.id,
      comment
    })

    res.json(comment)
  } catch (err) {
    console.error('Error adding comment:', err)
    res.status(500).json({ error: 'Ошибка добавления комментария' })
  }
})

router.post('/comments/:id/like', authMiddleware, (req, res) => {
  try {
    const existing = db.prepare('SELECT 1 FROM comment_likes WHERE userId = ? AND commentId = ?')
      .get(req.userId, req.params.id)

    if (existing) {
      db.prepare('DELETE FROM comment_likes WHERE userId = ? AND commentId = ?')
        .run(req.userId, req.params.id)
    } else {
      db.prepare('INSERT INTO comment_likes (userId, commentId) VALUES (?, ?)')
        .run(req.userId, req.params.id)
    }

    const likesCount = db.prepare('SELECT COUNT(*) as count FROM comment_likes WHERE commentId = ?')
      .get(req.params.id).count

    res.json({ liked: !existing, likesCount })
  } catch (err) {
    console.error('Error liking comment:', err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

router.delete('/comments/:id', authMiddleware, (req, res) => {
  try {
    const comment = db.prepare('SELECT c.authorId, c.postId, p.authorId as postAuthorId FROM comments c JOIN posts p ON c.postId = p.id WHERE c.id = ?')
      .get(req.params.id)

    if (!comment) {
      return res.status(404).json({ error: 'Комментарий не найден' })
    }

    if (comment.authorId !== req.userId && comment.postAuthorId !== req.userId) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    db.prepare('DELETE FROM comment_likes WHERE commentId IN (SELECT id FROM comments WHERE parentId = ?)').run(req.params.id)
    db.prepare('DELETE FROM comments WHERE parentId = ?').run(req.params.id)
    
    db.prepare('DELETE FROM comment_likes WHERE commentId = ?').run(req.params.id)
    
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id)

    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting comment:', err)
    res.status(500).json({ error: 'Ошибка удаления комментария' })
  }
})

export default router
