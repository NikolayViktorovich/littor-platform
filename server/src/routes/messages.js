import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/dialogs', authMiddleware, (req, res) => {
  const dialogs = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.lastSeen,
      m.id as messageId, m.content, m.senderId, m.createdAt, m.mediaType,
      (SELECT COUNT(*) FROM messages 
       WHERE senderId = u.id AND receiverId = ? AND isRead = 0 
       AND (deletedByReceiver IS NULL OR deletedByReceiver = 0)) as unreadCount,
      ds.isPinned, ds.isMuted
    FROM users u
    JOIN messages m ON m.id = (
      SELECT id FROM messages 
      WHERE ((senderId = u.id AND receiverId = ? AND (deletedByReceiver IS NULL OR deletedByReceiver = 0)) 
         OR (senderId = ? AND receiverId = u.id AND (deletedBySender IS NULL OR deletedBySender = 0)))
      ORDER BY createdAt DESC LIMIT 1
    )
    LEFT JOIN dialog_settings ds ON ds.oderId = (
      CASE WHEN u.id < ? THEN u.id || '-' || ? ELSE ? || '-' || u.id END
    )
    WHERE u.id != ?
    ORDER BY ds.isPinned DESC, ds.pinnedAt DESC, m.createdAt DESC
  `).all(req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId)

  const result = dialogs.map(d => {
    let content = d.content
    // For system messages, show preview instead of raw content
    if (d.mediaType === 'system') {
      content = getMediaPreview(d.mediaType, d.content)
    } else if (!content) {
      content = getMediaPreview(d.mediaType, d.content)
    }
    
    return {
      user: { 
        id: d.id, 
        name: d.name, 
        avatar: d.avatar,
        isOnline: d.lastSeen && (Date.now() - new Date(d.lastSeen).getTime()) < 300000
      },
      lastMessage: { 
        id: d.messageId, 
        content, 
        senderId: d.senderId, 
        createdAt: d.createdAt 
      },
      unreadCount: d.unreadCount,
      isPinned: d.isPinned || 0,
      isMuted: d.isMuted || 0
    }
  })

  res.json(result)
})

function getMediaPreview(mediaType, content) {
  if (!mediaType) return ''
  if (mediaType === 'system') {
    if (content && content.startsWith('pinned_message:')) return '📌 Сообщение закреплено'
    if (content === 'unpinned_message') return '📌 Сообщение откреплено'
    return ''
  }
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

// Counts endpoint for sidebar badges
router.get('/counts', authMiddleware, (req, res) => {
  try {
    // Count unread messages
    const messagesResult = db.prepare(`
      SELECT COUNT(DISTINCT senderId) as count 
      FROM messages 
      WHERE receiverId = ? AND isRead = 0
    `).get(req.userId)

    // Count incoming friend requests
    const friendsResult = db.prepare(`
      SELECT COUNT(*) as count 
      FROM friendships 
      WHERE friendId = ? AND status = 'pending'
    `).get(req.userId)

    res.json({
      messages: messagesResult?.count || 0,
      friends: friendsResult?.count || 0
    })
  } catch (err) {
    console.error('Error fetching counts:', err)
    res.json({ messages: 0, friends: 0 })
  }
})

// Get recent unread messages for toast notifications
router.get('/recent', authMiddleware, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, u.name as senderName, u.avatar as senderAvatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.receiverId = ? AND m.isRead = 0
      ORDER BY m.createdAt DESC
      LIMIT 5
    `).all(req.userId)

    res.json(messages)
  } catch (err) {
    console.error('Error fetching recent messages:', err)
    res.json([])
  }
})

// Pin/unpin dialog
router.post('/dialogs/:id/pin', authMiddleware, (req, res) => {
  try {
    const oderId = [req.userId, req.params.id].sort().join('-')
    const existing = db.prepare('SELECT * FROM dialog_settings WHERE oderId = ?').get(oderId)
    
    if (existing) {
      const newPinned = existing.isPinned ? 0 : 1
      db.prepare('UPDATE dialog_settings SET isPinned = ?, pinnedAt = ? WHERE oderId = ?')
        .run(newPinned, newPinned ? new Date().toISOString() : null, oderId)
      res.json({ isPinned: newPinned })
    } else {
      db.prepare('INSERT INTO dialog_settings (oderId, isPinned, pinnedAt) VALUES (?, 1, ?)')
        .run(oderId, new Date().toISOString())
      res.json({ isPinned: 1 })
    }
  } catch (err) {
    console.error('Error pinning dialog:', err)
    res.status(500).json({ error: 'Ошибка закрепления' })
  }
})

// Mute/unmute dialog
router.post('/dialogs/:id/mute', authMiddleware, (req, res) => {
  try {
    const oderId = [req.userId, req.params.id].sort().join('-')
    const existing = db.prepare('SELECT * FROM dialog_settings WHERE oderId = ?').get(oderId)
    
    if (existing) {
      const newMuted = existing.isMuted ? 0 : 1
      db.prepare('UPDATE dialog_settings SET isMuted = ? WHERE oderId = ?').run(newMuted, oderId)
      res.json({ isMuted: newMuted })
    } else {
      db.prepare('INSERT INTO dialog_settings (oderId, isMuted) VALUES (?, 1)').run(oderId)
      res.json({ isMuted: 1 })
    }
  } catch (err) {
    console.error('Error muting dialog:', err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

// Delete dialog (delete all messages for current user)
router.delete('/dialogs/:id', authMiddleware, (req, res) => {
  try {
    const { forAll } = req.query
    
    if (forAll === 'true') {
      // Delete all messages completely
      db.prepare(`
        DELETE FROM messages 
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
      `).run(req.userId, req.params.id, req.params.id, req.userId)
    } else {
      // Mark all messages as deleted for this user only
      db.prepare(`
        UPDATE messages SET deletedBySender = 1 
        WHERE senderId = ? AND receiverId = ?
      `).run(req.userId, req.params.id)
      
      db.prepare(`
        UPDATE messages SET deletedByReceiver = 1 
        WHERE senderId = ? AND receiverId = ?
      `).run(req.params.id, req.userId)
    }
    
    // Also delete dialog settings
    const oderId = [req.userId, req.params.id].sort().join('-')
    db.prepare('DELETE FROM dialog_settings WHERE oderId = ?').run(oderId)
    db.prepare('DELETE FROM pinned_messages WHERE oderId = ?').run(oderId)
    
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting dialog:', err)
    res.status(500).json({ error: 'Ошибка удаления' })
  }
})

// Forward message - must be before /:id route
router.post('/forward', authMiddleware, (req, res) => {
  try {
    const { messageId, toUserId } = req.body
    
    // Check if blocked
    const blocked = db.prepare(`
      SELECT 1 FROM blocks 
      WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)
    `).get(req.userId, toUserId, toUserId, req.userId)
    
    if (blocked) {
      return res.status(403).json({ error: 'Невозможно переслать сообщение' })
    }
    
    const original = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId)
    if (!original) {
      return res.status(404).json({ error: 'Сообщение не найдено' })
    }

    const id = uuid()
    const createdAt = new Date().toISOString()
    // Если сообщение уже было переслано, сохраняем оригинального отправителя
    const forwardedFromId = original.forwardedFromId || original.senderId

    db.prepare(`
      INSERT INTO messages (id, senderId, receiverId, content, media, mediaType, forwarded, forwardedFromId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, req.userId, toUserId, original.content, original.media, original.mediaType, forwardedFromId, createdAt)

    res.json({ success: true })
  } catch (err) {
    console.error('Error forwarding message:', err)
    res.status(500).json({ error: 'Ошибка пересылки' })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, 
           u.id as forwardedFromUserId, 
           u.name as forwardedFromName, 
           u.avatar as forwardedFromAvatar,
           r.id as replyToMsgId,
           r.content as replyToContent,
           r.senderId as replyToSenderId,
           ru.name as replyToSenderName
    FROM messages m
    LEFT JOIN users u ON m.forwardedFromId = u.id
    LEFT JOIN messages r ON m.replyToId = r.id
    LEFT JOIN users ru ON r.senderId = ru.id
    WHERE (
      (m.senderId = ? AND m.receiverId = ? AND (m.deletedBySender IS NULL OR m.deletedBySender = 0)) 
      OR (m.senderId = ? AND m.receiverId = ? AND (m.deletedByReceiver IS NULL OR m.deletedByReceiver = 0))
    )
    ORDER BY m.createdAt ASC
  `).all(req.userId, req.params.id, req.params.id, req.userId)

  const result = messages.map(msg => ({
    ...msg,
    forwardedFrom: msg.forwardedFromUserId ? {
      id: msg.forwardedFromUserId,
      name: msg.forwardedFromName,
      avatar: msg.forwardedFromAvatar
    } : null,
    replyTo: msg.replyToMsgId ? {
      id: msg.replyToMsgId,
      content: msg.replyToContent,
      senderId: msg.replyToSenderId,
      senderName: msg.replyToSenderName
    } : null,
    forwardedFromUserId: undefined,
    forwardedFromName: undefined,
    forwardedFromAvatar: undefined,
    replyToMsgId: undefined,
    replyToContent: undefined,
    replyToSenderId: undefined,
    replyToSenderName: undefined
  }))

  res.json(result)
})

// Get pinned message for a chat
router.get('/:id/pinned', authMiddleware, (req, res) => {
  try {
    const oderId = [req.userId, req.params.id].sort().join('-')
    const pinned = db.prepare(`
      SELECT m.*, u.name as senderName
      FROM pinned_messages pm
      JOIN messages m ON pm.messageId = m.id
      JOIN users u ON m.senderId = u.id
      WHERE pm.oderId = ?
    `).get(oderId)
    
    res.json(pinned || null)
  } catch (err) {
    res.json(null)
  }
})

// Pin/unpin message
router.post('/:id/pin', authMiddleware, (req, res) => {
  try {
    const { messageId } = req.body
    const oderId = [req.userId, req.params.id].sort().join('-')
    
    // Check if already pinned
    const existing = db.prepare('SELECT * FROM pinned_messages WHERE oderId = ?').get(oderId)
    
    if (existing) {
      // Unpin or replace
      db.prepare('DELETE FROM pinned_messages WHERE oderId = ?').run(oderId)
    }
    
    let action = 'unpinned'
    if (messageId) {
      db.prepare('INSERT INTO pinned_messages (oderId, recipientId, messageId) VALUES (?, ?, ?)')
        .run(oderId, req.params.id, messageId)
      action = 'pinned'
    }
    
    // Create system message about pin/unpin with reference to pinned message
    const systemMsgId = uuid()
    const createdAt = new Date().toISOString()
    const systemContent = action === 'pinned' ? `pinned_message:${messageId}` : 'unpinned_message'
    
    db.prepare(`
      INSERT INTO messages (id, senderId, receiverId, content, mediaType, createdAt)
      VALUES (?, ?, ?, ?, 'system', ?)
    `).run(systemMsgId, req.userId, req.params.id, systemContent, createdAt)
    
    // Emit to both users
    const io = req.app.get('io')
    const systemMsg = {
      id: systemMsgId,
      senderId: req.userId,
      receiverId: req.params.id,
      content: systemContent,
      mediaType: 'system',
      createdAt
    }
    io.to(`user:${req.params.id}`).emit('message:new', systemMsg)
    io.to(`user:${req.params.id}`).emit('message:pin', { oderId, messageId, action })
    
    res.json({ success: true, action })
  } catch (err) {
    console.error('Error pinning message:', err)
    res.status(500).json({ error: 'Ошибка закрепления' })
  }
})

router.post('/:id', authMiddleware, upload.single('media'), (req, res) => {
  try {
    const { content, mediaType, replyToId } = req.body
    const media = req.file ? `/uploads/${req.file.filename}` : null

    if (!content?.trim() && !media) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    // Check if blocked
    const blocked = db.prepare(`
      SELECT 1 FROM blocks 
      WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)
    `).get(req.userId, req.params.id, req.params.id, req.userId)
    
    if (blocked) {
      return res.status(403).json({ error: 'Невозможно отправить сообщение' })
    }

    const id = uuid()
    const createdAt = new Date().toISOString()
    const messageContent = content?.trim() || null

    db.prepare('INSERT INTO messages (id, senderId, receiverId, content, media, mediaType, replyToId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, req.params.id, messageContent, media, mediaType || null, replyToId || null, createdAt)

    // Get reply info if exists
    let replyTo = null
    if (replyToId) {
      const replyMsg = db.prepare(`
        SELECT m.id, m.content, m.senderId, u.name as senderName 
        FROM messages m JOIN users u ON m.senderId = u.id WHERE m.id = ?
      `).get(replyToId)
      if (replyMsg) {
        replyTo = {
          id: replyMsg.id,
          content: replyMsg.content,
          senderId: replyMsg.senderId,
          senderName: replyMsg.senderName
        }
      }
    }

    const message = {
      id,
      senderId: req.userId,
      receiverId: req.params.id,
      content: messageContent,
      media,
      mediaType: mediaType || null,
      replyToId: replyToId || null,
      replyTo,
      isRead: 0,
      createdAt
    }

    // Emit to receiver via socket
    const io = req.app.get('io')
    io.to(`user:${req.params.id}`).emit('message:new', message)

    res.json(message)
  } catch (err) {
    console.error('Error sending message:', err)
    res.status(500).json({ error: 'Ошибка отправки сообщения' })
  }
})

router.post('/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ?')
    .run(req.params.id, req.userId)

  // Notify sender that messages were read
  const io = req.app.get('io')
  io.to(`user:${req.params.id}`).emit('message:read', { 
    by: req.userId,
    chatWith: req.params.id 
  })

  res.json({ success: true })
})

// Delete message
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { forAll } = req.query
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
    
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' })
    }

    if (forAll === 'true') {
      // Only sender can delete for all
      if (message.senderId !== req.userId) {
        return res.status(403).json({ error: 'Нет прав для удаления' })
      }
      db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id)
    } else {
      // Delete for self - mark as deleted for this user
      if (message.senderId === req.userId) {
        db.prepare('UPDATE messages SET deletedBySender = 1 WHERE id = ?').run(req.params.id)
      } else {
        db.prepare('UPDATE messages SET deletedByReceiver = 1 WHERE id = ?').run(req.params.id)
      }
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting message:', err)
    res.status(500).json({ error: 'Ошибка удаления' })
  }
})

export default router
