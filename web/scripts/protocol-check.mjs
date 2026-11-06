import assert from 'node:assert/strict'
import { Assembler, buildTransfer, parseFrame } from '../src/lib/protocol.js'
import { qrMake } from '../src/lib/qrMake.js'

async function roundTrip(name, bytes, chunkSize) {
  const { frames, meta, total } = await buildTransfer(name, bytes, chunkSize)
  assert.equal(frames.length, total)
  assert.equal(parseFrame(frames[0]).index, 0)
  assert.equal(parseFrame(frames[0]).total, total)

  // Duplicate every frame and shuffle to emulate a noisy, out-of-order scan.
  const noisy = [...frames, ...frames].sort(() => Math.random() - 0.5)
  const assembler = new Assembler()
  for (const raw of noisy) {
    const frame = parseFrame(raw)
    if (frame) assembler.ingest(frame)
  }

  assert.equal(assembler.complete, true)
  const result = await assembler.assemble()
  assert.equal(result.name, name)
  assert.deepEqual(Buffer.from(result.data), Buffer.from(bytes))
  console.log(`OK ${name}: ${bytes.length} bytes -> ${total} frames, gzip=${meta.g}, crc=${meta.c}`)
}

const text = new TextEncoder().encode('QR transfer tanpa server. '.repeat(500))
await roundTrip('catatan.txt', text, 300)

const random = new Uint8Array(4096)
for (let i = 0; i < random.length; i++) random[i] = (Math.random() * 256) | 0
await roundTrip('acak.bin', random, 1000)

await roundTrip('kosong.txt', new Uint8Array(0), 600)

const metaPayload = Buffer.from('{"n":"a","s":0,"c":"0","g":0}').toString('base64')
const frame = `QF|abcd|0|3|${metaPayload}`
assert.deepEqual(parseFrame(frame), {
  sessionId: 'abcd',
  index: 0,
  total: 3,
  payload: metaPayload,
})
assert.equal(parseFrame('bukan-qr'), null)

const qr = qrMake(new TextEncoder().encode(frame))
assert.equal(qr.n, qr.m.length)
assert.equal(qr.n, qr.m[0].length)
assert.ok(qr.m.flat().some(Boolean))
console.log(`OK qrMake: ${qr.n}x${qr.n}`)
console.log('protocol OK')
