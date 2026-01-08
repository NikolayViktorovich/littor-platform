import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(400).json({ error: 'Email уже зарегистрирован' })
  }

  const id = uuid()
  const hashedPassword = await bcrypt.hash(password, 10)

  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)')
    .run(id, email, hashedPassword, name)

  const user = { id, email, name, avatar: null, bio: null }
  const token = generateToken(id)

  res.json({ user, token })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(400).json({ error: 'Неверный email или пароль' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(400).json({ error: 'Неверный email или пароль' })
  }

  const token = generateToken(user.id)
  const { password: _, ...userData } = user

  res.json({ user: userData, token })
})

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, avatar, bio FROM users WHERE id = ?')
    .get(req.userId)

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  res.json(user)
})

export default router
