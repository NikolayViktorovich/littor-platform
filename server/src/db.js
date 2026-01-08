import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = 'littor.db'
let db = null

export async function initDb() {
  const SQL = await initSqlJs()
  
  // Load existing database or create new
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
      avatar TEXT,
      bio TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      authorId TEXT NOT NULL,
      content TEXT,
      image TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (authorId) REFERENCES users(id)
    )
  `)

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

  // Migration: add parentId column if not exists
  try {
    db.run(`ALTER TABLE comments ADD COLUMN parentId TEXT`)
  } catch (e) {
    // Column already exists
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

  // Migration: add media columns if not exists
  try {
    const cols = db.exec("PRAGMA table_info(messages)")
    const colNames = cols[0]?.values?.map(c => c[1]) || []
    if (!colNames.includes('media')) {
      db.run(`ALTER TABLE messages ADD COLUMN media TEXT`)
    }
    if (!colNames.includes('mediaType')) {
      db.run(`ALTER TABLE messages ADD COLUMN mediaType TEXT`)
    }
  } catch (e) {
    console.log('Migration check:', e.message)
  }

  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(authorId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(createdAt DESC)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(senderId, receiverId)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt)`)

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

// Helper functions to match better-sqlite3 API
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
