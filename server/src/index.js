import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { WebSocketServer } from 'ws'

// ---- Config ----
const {
  MONGO_URI = 'mongodb://127.0.0.1:27017',
  DB_NAME = 'face_security',
  FIXED_USERNAME = 'admin',
  FIXED_PASSWORD = 'letmein123!',
  JWT_SECRET = '60446c00548bbc409516496999dbc20fbc3822d0885b5178d375af58716e82b5',
  JWT_ALG = 'HS256',
  INGEST_KEY = 'ingest-12345',
  PORT = 8000,
  PYTHON_EXE = 'python'
} = process.env

const app = express()
app.use(cors())
app.use(express.json())

// ---- DB ----
const client = new MongoClient(MONGO_URI)
await client.connect()
const db = client.db(DB_NAME)
const logs = db.collection('activity_logs')

// ---- WS ----
const wss = new WebSocketServer({ noServer: true })
const sockets = new Set()
wss.on('connection', ws => {
  sockets.add(ws)
  ws.on('close', () => sockets.delete(ws))
})
function broadcast(obj) {
  const msg = JSON.stringify(obj)
  for (const ws of sockets) { try { ws.send(msg) } catch {} }
}

// ---- Auth helpers ----
function createToken(sub) {
  return jwt.sign({ sub }, JWT_SECRET, { algorithm: JWT_ALG, expiresIn: '12h' })
}
function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
  if (!token) return res.status(401).json({ detail: 'Not authenticated' })
  try { jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALG] }); next() }
  catch { return res.status(401).json({ detail: 'Invalid token' }) }
}

app.get('/', (_req, res) => res.json({ ok: true }))

// ---- Auth + data APIs ----
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === FIXED_USERNAME && password === FIXED_PASSWORD) {
    return res.json({ access_token: createToken(username), token_type: 'bearer' })
  }
  return res.status(401).json({ detail: 'Invalid credentials' })
})

app.post('/api/events', async (req, res) => {
  if (req.headers['x-ingest-key'] !== INGEST_KEY) return res.status(403).json({ detail: 'Forbidden' })
  const e = req.body || {}
  if (!e.ts) e.ts = new Date().toISOString()
  if (!['manish', 'random'].includes(e.user || '')) e.user = 'random'
  if (!e.event) e.event = 'unknown'
  await logs.insertOne(e)
  broadcast({ type: 'event', ...e })
  res.json({ ok: true })
})

app.get('/api/activity', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '200', 10), 1000)
  const items = await logs.find({}).sort({ ts: -1 }).limit(limit).toArray()
  res.json({ items })
})

app.get('/api/stats', requireAuth, async (_req, res) => {
  const total = await logs.countDocuments({})
  const p = await logs.countDocuments({ user: 'manish' })
  const r = await logs.countDocuments({ user: 'random' })
  const last = await logs.find({}).sort({ ts: -1 }).limit(1).toArray()
  res.json({ total, manish: p, random: r, last_ts: last[0]?.ts || null })
})

// ---- Start/Stop monitor_embeddings.py ----
let monitorProc = null
const projectRoot = path.resolve(process.cwd(), '..')
const monitorScript = path.join(projectRoot, 'monitor_embeddings.py')

app.get('/api/monitor/status', requireAuth, (_req, res) => res.json({ running: !!monitorProc }))

app.post('/api/monitor/start', requireAuth, (_req, res) => {
  if (monitorProc) return res.json({ running: true })
  monitorProc = spawn(PYTHON_EXE, [monitorScript], {
    cwd: projectRoot,
    env: { ...process.env, API_BASE: `http://localhost:${PORT}`, INGEST_KEY }
  })
  monitorProc.stdout.on('data', d => console.log('[monitor]', d.toString().trim()))
  monitorProc.stderr.on('data', d => console.error('[monitor]', d.toString().trim()))
  monitorProc.on('exit', () => { monitorProc = null })
  res.json({ running: true })
})

app.post('/api/monitor/stop', requireAuth, (_req, res) => {
  if (!monitorProc) return res.json({ running: false })
  try { monitorProc.kill('SIGTERM') } catch {}
  monitorProc = null
  res.json({ running: false })
})

// ---- HTTP + WS ----
const server = app.listen(PORT, () => console.log(`HTTP API listening on http://localhost:${PORT}`))
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req))
  else socket.destroy()
})
