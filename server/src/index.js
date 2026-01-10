import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { initDb } from './db.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import postsRoutes from './routes/posts.js'
import friendsRoutes from './routes/friends.js'
import messagesRoutes from './routes/messages.js'
import musicRoutes from './routes/music.js'
import notificationsRoutes from './routes/notifications.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 4000

const onlineUsers = new Map()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.set('io', io)
app.set('onlineUsers', onlineUsers)

io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Authentication required'))
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    socket.userId = decoded.userId
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  const userId = socket.userId
  onlineUsers.set(userId, socket.id)
  
  socket.join(`user:${userId}`)
  
  socket.broadcast.emit('user:online', { userId })
  
  socket.on('disconnect', () => {
    onlineUsers.delete(userId)
    socket.broadcast.emit('user:offline', { userId })
  })
  
  socket.on('post:join', (postId) => {
    socket.join(`post:${postId}`)
  })
  
  socket.on('post:leave', (postId) => {
    socket.leave(`post:${postId}`)
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/friends', friendsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/music', musicRoutes)
app.use('/api/notifications', notificationsRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

async function start() {
  await initDb()
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()

export { io, onlineUsers }
