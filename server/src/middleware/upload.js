import multer from 'multer'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav'
  ]
  cb(null, allowed.includes(file.mimetype))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
})
