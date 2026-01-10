import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = 'littor.db'
let db = null

export async function initDb() {
  const SQL = await initSqlJs()
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      username TEXT,
      avatar TEXT,
      cover TEXT,
      bio TEXT,
      lastSeen TEXT,
      emailVerified INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  try {
    const cols = db.exec("PRAGMA table_info(users)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('cover')) db.run(`ALTER TABLE users ADD COLUMN cover TEXT`)
    if (!colNames.includes('lastSeen')) db.run(`ALTER TABLE users ADD COLUMN lastSeen TEXT`)
    if (!colNames.includes('emailVerified')) db.run(`ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0`)
    if (!colNames.includes('username')) db.run(`ALTER TABLE users ADD COLUMN username TEXT`)
    if (!colNames.includes('settings')) db.run(`ALTER TABLE users ADD COLUMN settings TEXT`)
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      authorId TEXT NOT NULL,
      content TEXT,
      image TEXT,
      isPinned INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      commentsDisabled INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (authorId) REFERENCES users(id)
    )
  `)

  try {
    const cols = db.exec("PRAGMA table_info(posts)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('isPinned')) db.run(`ALTER TABLE posts ADD COLUMN isPinned INTEGER DEFAULT 0`)
    if (!colNames.includes('isArchived')) db.run(`ALTER TABLE posts ADD COLUMN isArchived INTEGER DEFAULT 0`)
    if (!colNames.includes('commentsDisabled')) db.run(`ALTER TABLE posts ADD COLUMN commentsDisabled INTEGER DEFAULT 0`)
    if (!colNames.includes('media')) db.run(`ALTER TABLE posts ADD COLUMN media TEXT`)
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      userId TEXT NOT NULL,
      postId TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, postId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (postId) REFERENCES posts(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      parentId TEXT,
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postId) REFERENCES posts(id),
      FOREIGN KEY (authorId) REFERENCES users(id),
      FOREIGN KEY (parentId) REFERENCES comments(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      userId TEXT NOT NULL,
      commentId TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, commentId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (commentId) REFERENCES comments(id)
    )
  `)

  try {
    db.run(`ALTER TABLE comments ADD COLUMN parentId TEXT`)
  } catch (e) {
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS friendships (
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, friendId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (friendId) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      content TEXT,
      media TEXT,
      mediaType TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users(id),
      FOREIGN KEY (receiverId) REFERENCES users(id)
    )
  `)

  try {
    const cols = db.exec("PRAGMA table_info(messages)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('media')) {
      db.run(`ALTER TABLE messages ADD COLUMN media TEXT`)
    }
    if (!colNames.includes('mediaType')) {
      db.run(`ALTER TABLE messages ADD COLUMN mediaType TEXT`)
    }
    if (!colNames.includes('forwarded')) {
      db.run(`ALTER TABLE messages ADD COLUMN forwarded INTEGER DEFAULT 0`)
    }
    if (!colNames.includes('deletedBySender')) {
      db.run(`ALTER TABLE messages ADD COLUMN deletedBySender INTEGER DEFAULT 0`)
    }
    if (!colNames.includes('deletedByReceiver')) {
      db.run(`ALTER TABLE messages ADD COLUMN deletedByReceiver INTEGER DEFAULT 0`)
    }
    if (!colNames.includes('forwardedFromId')) {
      db.run(`ALTER TABLE messages ADD COLUMN forwardedFromId TEXT`)
    }
    if (!colNames.includes('replyToId')) {
      db.run(`ALTER TABLE messages ADD COLUMN replyToId TEXT`)
    }
    if (!colNames.includes('fileName')) {
      db.run(`ALTER TABLE messages ADD COLUMN fileName TEXT`)
    }
    if (!colNames.includes('fileSize')) {
      db.run(`ALTER TABLE messages ADD COLUMN fileSize INTEGER`)
    }
    if (!colNames.includes('musicTrackId')) {
      db.run(`ALTER TABLE messages ADD COLUMN musicTrackId TEXT`)
    }
    if (!colNames.includes('musicTitle')) {
      db.run(`ALTER TABLE messages ADD COLUMN musicTitle TEXT`)
    }
    if (!colNames.includes('musicArtist')) {
      db.run(`ALTER TABLE messages ADD COLUMN musicArtist TEXT`)
    }
    if (!colNames.includes('musicArtwork')) {
      db.run(`ALTER TABLE messages ADD COLUMN musicArtwork TEXT`)
    }
  } catch (e) {
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS pinned_messages (
      oderId TEXT NOT NULL,
      recipientId TEXT NOT NULL,
      messageId TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (oderId, recipientId),
      FOREIGN KEY (messageId) REFERENCES messages(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS dialog_settings (
      oderId TEXT PRIMARY KEY,
      isPinned INTEGER DEFAULT 0,
      isMuted INTEGER DEFAULT 0,
      pinnedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(authorId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(createdAt DESC)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(senderId, receiverId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS blocks (
      blockerId TEXT NOT NULL,
      blockedId TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (blockerId, blockedId),
      FOREIGN KEY (blockerId) REFERENCES users(id),
      FOREIGN KEY (blockedId) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS user_tracks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      trackId TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      artwork TEXT,
      duration INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      fromUserId TEXT,
      messageId TEXT,
      chatId TEXT,
      postId TEXT,
      content TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (fromUserId) REFERENCES users(id)
    )
  `)

  try {
    const cols = db.exec("PRAGMA table_info(notifications)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('postId')) db.run(`ALTER TABLE notifications ADD COLUMN postId TEXT`)
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS listening_history (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      trackId TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      artwork TEXT,
      duration INTEGER,
      playedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT NOT NULL,
      deviceName TEXT,
      deviceType TEXT,
      browser TEXT,
      os TEXT,
      ip TEXT,
      location TEXT,
      lastActive TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  try {
    const cols = db.exec("PRAGMA table_info(posts)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('musicTrackId')) db.run(`ALTER TABLE posts ADD COLUMN musicTrackId TEXT`)
    if (!colNames.includes('musicTitle')) db.run(`ALTER TABLE posts ADD COLUMN musicTitle TEXT`)
    if (!colNames.includes('musicArtist')) db.run(`ALTER TABLE posts ADD COLUMN musicArtist TEXT`)
    if (!colNames.includes('musicArtwork')) db.run(`ALTER TABLE posts ADD COLUMN musicArtwork TEXT`)
  } catch (e) {}

  try {
    const cols = db.exec("PRAGMA table_info(messages)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('musicTrackId')) db.run(`ALTER TABLE messages ADD COLUMN musicTrackId TEXT`)
    if (!colNames.includes('musicTitle')) db.run(`ALTER TABLE messages ADD COLUMN musicTitle TEXT`)
    if (!colNames.includes('musicArtist')) db.run(`ALTER TABLE messages ADD COLUMN musicArtist TEXT`)
    if (!colNames.includes('musicArtwork')) db.run(`ALTER TABLE messages ADD COLUMN musicArtwork TEXT`)
  } catch (e) {}

  saveDb()
  console.log('Database initialized')
}

export function saveDb() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}

export function prepare(sql) {
  return {
    run(...params) {
      db.run(sql, params)
      saveDb()
      return { changes: db.getRowsModified() }
    },
    get(...params) {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.free()
        return row
      }
      stmt.free()
      return undefined
    },
    all(...params) {
      const results = []
      const stmt = db.prepare(sql)
      stmt.bind(params)
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    }
  }
}

export default { prepare }
