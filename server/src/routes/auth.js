import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import { sendVerificationEmail, sendPasswordResetEmail, generateCode } from '../email.js'

const router = Router()

// Register - Step 1: Create account and send verification code
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
  }

  const existing = db.prepare('SELECT id, emailVerified FROM users WHERE email = ?').get(email)
  if (existing) {
    if (existing.emailVerified) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' })
    }
    // Delete unverified account to allow re-registration
    db.prepare('DELETE FROM users WHERE id = ?').run(existing.id)
  }

  const id = uuid()
  const hashedPassword = await bcrypt.hash(password, 10)

  db.prepare('INSERT INTO users (id, email, password, name, emailVerified) VALUES (?, ?, ?, ?, 0)')
    .run(id, email, hashedPassword, name)

  // Generate and send verification code
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

  db.prepare('INSERT INTO verification_codes (id, email, code, type, expiresAt) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), email, code, 'email_verification', expiresAt)

  const sent = await sendVerificationEmail(email, code)

  res.json({ 
    message: 'Код подтверждения отправлен на email',
    email,
    userId: id,
    emailSent: sent
  })
})

// Verify email code
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({ error: 'Укажите email и код' })
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE email = ? AND code = ? AND type = 'email_verification' AND used = 0
    ORDER BY createdAt DESC LIMIT 1
  `).get(email, code)

  if (!verification) {
    return res.status(400).json({ error: 'Неверный код' })
  }

  if (new Date(verification.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый.' })
  }

  // Mark code as used
  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id)

  // Verify user email
  db.prepare('UPDATE users SET emailVerified = 1 WHERE email = ?').run(email)

  const user = db.prepare('SELECT id, email, name, avatar, bio FROM users WHERE email = ?').get(email)
  const token = generateToken(user.id)

  res.json({ user, token, message: 'Email подтверждён' })
})

// Resend verification code
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Укажите email' })
  }

  const user = db.prepare('SELECT id, emailVerified FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(400).json({ error: 'Пользователь не найден' })
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email уже подтверждён' })
  }

  // Check rate limit (1 code per minute)
  const recentCode = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE email = ? AND type = 'email_verification' 
    AND datetime(createdAt) > datetime('now', '-1 minute')
  `).get(email)

  if (recentCode) {
    return res.status(429).json({ error: 'Подождите минуту перед повторной отправкой' })
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  db.prepare('INSERT INTO verification_codes (id, email, code, type, expiresAt) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), email, code, 'email_verification', expiresAt)

  const sent = await sendVerificationEmail(email, code)

  res.json({ message: 'Код отправлен повторно', emailSent: sent })
})

// Login
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

  // Check if email is verified
  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email не подтверждён', 
      needsVerification: true,
      email: user.email 
    })
  }

  const token = generateToken(user.id)
  const { password: _, ...userData } = user

  res.json({ user: userData, token })
})

// Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Укажите email' })
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (!user) {
    // Don't reveal if email exists
    return res.json({ message: 'Если email зарегистрирован, код будет отправлен' })
  }

  // Check rate limit
  const recentCode = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE email = ? AND type = 'password_reset' 
    AND datetime(createdAt) > datetime('now', '-1 minute')
  `).get(email)

  if (recentCode) {
    return res.status(429).json({ error: 'Подождите минуту перед повторной отправкой' })
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  db.prepare('INSERT INTO verification_codes (id, email, code, type, expiresAt) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), email, code, 'password_reset', expiresAt)

  const sent = await sendPasswordResetEmail(email, code)

  res.json({ message: 'Код отправлен на email', emailSent: sent })
})

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({ error: 'Укажите email и код' })
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE email = ? AND code = ? AND type = 'password_reset' AND used = 0
    ORDER BY createdAt DESC LIMIT 1
  `).get(email, code)

  if (!verification) {
    return res.status(400).json({ error: 'Неверный код' })
  }

  if (new Date(verification.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый.' })
  }

  res.json({ valid: true, message: 'Код верный' })
})

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
  }

  const verification = db.prepare(`
    SELECT * FROM verification_codes 
    WHERE email = ? AND code = ? AND type = 'password_reset' AND used = 0
    ORDER BY createdAt DESC LIMIT 1
  `).get(email, code)

  if (!verification) {
    return res.status(400).json({ error: 'Неверный код' })
  }

  if (new Date(verification.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Код истёк. Запросите новый.' })
  }

  // Mark code as used
  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id)

  // Update password
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email)

  res.json({ message: 'Пароль успешно изменён' })
})

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, avatar, bio, emailVerified FROM users WHERE id = ?')
    .get(req.userId)

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  res.json(user)
})

export default router
