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

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 4000

// Store online users: { oderId: socketId }
const onlineUsers = new Map()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Make io available to routes
app.set('io', io)
app.set('onlineUsers', onlineUsers)

// Socket.io authentication and connection
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
  
  // Join personal room for direct messages
  socket.join(`user:${userId}`)
  
  // Broadcast online status
  socket.broadcast.emit('user:online', { userId })
  
  socket.on('disconnect', () => {
    onlineUsers.delete(userId)
    socket.broadcast.emit('user:offline', { userId })
  })
  
  // Join a post room to receive comments/likes updates
  socket.on('post:join', (postId) => {
    socket.join(`post:${postId}`)
  })
  
  socket.on('post:leave', (postId) => {
    socket.leave(`post:${postId}`)
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/friends', friendsRoutes)
app.use('/api/messages', messagesRoutes)

// Error handler
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
