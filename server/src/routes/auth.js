import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import db from '../db.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import { sendVerificationEmail, sendPasswordResetEmail, generateCode } from '../email.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, name, username } = req.body

  if (!email || !password || !name || !username) {
    return res.status(400).json({ error: 'Заполните все поля' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Юзернейм: 3-20 символов, только буквы, цифры и _' })
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase())
  if (existingUsername) {
    return res.status(400).json({ error: 'Этот юзернейм уже занят' })
  }

  const existing = db.prepare('SELECT id, emailVerified FROM users WHERE email = ?').get(email)
  if (existing) {
    if (existing.emailVerified) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' })
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(existing.id)
  }

  const id = uuid()
  const hashedPassword = await bcrypt.hash(password, 10)

  db.prepare('INSERT INTO users (id, email, password, name, username, emailVerified) VALUES (?, ?, ?, ?, ?, 0)')
    .run(id, email, hashedPassword, name, username.toLowerCase())

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

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

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id)
  db.prepare('UPDATE users SET emailVerified = 1 WHERE email = ?').run(email)

  const user = db.prepare('SELECT id, email, name, username, avatar, bio FROM users WHERE email = ?').get(email)
  const token = generateToken(user.id)

  const userAgent = req.headers['user-agent'] || ''
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
  
  let deviceType = 'desktop'
  let browser = 'Unknown'
  let os = 'Unknown'
  
  if (/mobile|android|iphone|ipad/i.test(userAgent)) deviceType = 'mobile'
  else if (/tablet/i.test(userAgent)) deviceType = 'tablet'
  
  if (/chrome/i.test(userAgent)) browser = 'Chrome'
  else if (/firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/safari/i.test(userAgent)) browser = 'Safari'
  else if (/edge/i.test(userAgent)) browser = 'Edge'
  
  if (/windows/i.test(userAgent)) os = 'Windows'
  else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS'
  else if (/linux/i.test(userAgent)) os = 'Linux'
  else if (/android/i.test(userAgent)) os = 'Android'
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS'

  const sessionId = uuid()
  db.prepare(`INSERT INTO sessions (id, userId, token, deviceName, deviceType, browser, os, ip, lastActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(sessionId, user.id, token, `${browser} · ${os}`, deviceType, browser, os, ip, new Date().toISOString(), new Date().toISOString())

  res.json({ user, token, sessionId, message: 'Email подтверждён' })
})

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

  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email не подтверждён', 
      needsVerification: true,
      email: user.email 
    })
  }

  const token = generateToken(user.id)
  const { password: _, ...userData } = user

  const userAgent = req.headers['user-agent'] || ''
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
  
  let deviceType = 'desktop'
  let browser = 'Unknown'
  let os = 'Unknown'
  
  if (/mobile|android|iphone|ipad/i.test(userAgent)) deviceType = 'mobile'
  else if (/tablet/i.test(userAgent)) deviceType = 'tablet'
  
  if (/chrome/i.test(userAgent)) browser = 'Chrome'
  else if (/firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/safari/i.test(userAgent)) browser = 'Safari'
  else if (/edge/i.test(userAgent)) browser = 'Edge'
  
  if (/windows/i.test(userAgent)) os = 'Windows'
  else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS'
  else if (/linux/i.test(userAgent)) os = 'Linux'
  else if (/android/i.test(userAgent)) os = 'Android'
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS'

  const sessionId = uuid()
  db.prepare(`INSERT INTO sessions (id, userId, token, deviceName, deviceType, browser, os, ip, lastActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(sessionId, user.id, token, `${browser} · ${os}`, deviceType, browser, os, ip, new Date().toISOString(), new Date().toISOString())

  res.json({ user: userData, token, sessionId })
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Укажите email' })
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.json({ message: 'Если email зарегистрирован, код будет отправлен' })
  }

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

  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(verification.id)

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email)

  res.json({ message: 'Пароль успешно изменён' })
})

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, username, avatar, bio, emailVerified FROM users WHERE id = ?')
    .get(req.userId)

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' })
  }

  res.json(user)
})

export default router
