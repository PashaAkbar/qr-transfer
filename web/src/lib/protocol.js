import { base64ToBytes, bytesToBase64, crc32, decoder, encoder, gunzipBytes, gzipBytes } from './codec.js'

export const PREFIX = 'QF'

export function makeSessionId() {
  return Math.random().toString(36).slice(2, 6)
}

export function parseFrame(raw) {
  if (typeof raw !== 'string' || !raw.startsWith(PREFIX + '|')) return null
  const parts = raw.split('|')
  if (parts.length < 5) return null

  const index = Number(parts[2])
  const total = Number(parts[3])
  if (!Number.isInteger(index) || !Number.isInteger(total)) return null
  if (total <= 0 || index < 0 || index >= total) return null

  return {
    sessionId: parts[1],
    index,
    total,
    payload: parts.slice(4).join('|'),
  }
}

export async function buildTransfer(fileName, bytes, chunkSize) {
  const compressed = await gzipBytes(bytes)
  const useGzip = Boolean(compressed) && compressed.length < bytes.length
  const payload = useGzip ? compressed : bytes

  const size = Math.max(1, chunkSize)
  const chunkCount = Math.ceil(payload.length / size)
  const total = chunkCount + 1
  const sessionId = makeSessionId()
  const meta = {
    n: fileName,
    s: bytes.length,
    c: crc32(bytes),
    g: useGzip ? 1 : 0,
  }

  const metaPayload = bytesToBase64(encoder.encode(JSON.stringify(meta)))
  const frames = [`QF|${sessionId}|0|${total}|${metaPayload}`]

  for (let i = 0; i < chunkCount; i++) {
    const chunk = payload.subarray(i * size, (i + 1) * size)
    frames.push(`QF|${sessionId}|${i + 1}|${total}|${bytesToBase64(chunk)}`)
  }

  return { frames, meta, sessionId, total }
}

export class Assembler {
  constructor() {
    this.reset()
  }

  reset() {
    this.sessionId = ''
    this.total = 0
    this.meta = null
    this.chunks = new Map()
  }

  get received() {
    return this.chunks.size
  }

  get complete() {
    return this.total > 0 && this.meta !== null && this.chunks.size === this.total
  }

  ingest(frame) {
    if (frame.sessionId !== this.sessionId) {
      this.reset()
      this.sessionId = frame.sessionId
    }
    if (this.total !== 0 && frame.total !== this.total) {
      throw new Error('Jumlah frame tidak konsisten')
    }
    this.total = frame.total

    if (this.chunks.has(frame.index)) return false

    if (frame.index === 0) {
      try {
        this.meta = JSON.parse(decoder.decode(base64ToBytes(frame.payload)))
      } catch {
        return false
      }
    }

    this.chunks.set(frame.index, frame.payload)
    return true
  }

  async assemble() {
    if (!this.meta) throw new Error('Metadata belum diterima')
    if (this.chunks.size !== this.total) throw new Error('Frame belum lengkap')

    const parts = []
    for (let i = 1; i < this.total; i++) {
      parts.push(base64ToBytes(this.chunks.get(i)))
    }

    const length = parts.reduce((sum, part) => sum + part.length, 0)
    let data = new Uint8Array(length)
    let offset = 0
    for (const part of parts) {
      data.set(part, offset)
      offset += part.length
    }

    if (this.meta.g) data = await gunzipBytes(data)
    if (crc32(data) !== this.meta.c) throw new Error('Checksum tidak cocok')

    return { name: this.meta.n, data }
  }
}
