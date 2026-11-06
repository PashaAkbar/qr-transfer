import { useCallback, useEffect, useRef, useState } from 'react'
import { encoder } from '../lib/codec.js'
import { buildTransfer } from '../lib/protocol.js'
import { qrMake } from '../lib/qrMake.js'

const IDLE = 'Pilih file, lalu arahkan kamera perangkat penerima ke layar ini.'

export function useSender() {
  const [fileName, setFileName] = useState(null)
  const [status, setStatus] = useState(IDLE)
  const [sending, setSending] = useState(false)
  const [chunkSize, setChunkSize] = useState(600)
  const [fps, setFps] = useState(4)
  const [frameNumber, setFrameNumber] = useState(0)
  const [frameCount, setFrameCount] = useState(0)

  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const framesRef = useRef([])
  const timerRef = useRef(null)
  const indexRef = useRef(0)

  const drawFrame = useCallback((index) => {
    const frames = framesRef.current
    const canvas = canvasRef.current
    if (!canvas || !frames.length) return

    const { n, m } = qrMake(encoder.encode(frames[index]))
    const scale = Math.max(2, Math.floor(560 / (n + 8)))
    canvas.width = canvas.height = scale * (n + 8)

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (m[r][c]) ctx.fillRect((c + 4) * scale, (r + 4) * scale, scale, scale)
      }
    }

    setFrameNumber(index + 1)
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    setSending(false)
    setStatus('Pengiriman dihentikan.')
  }, [clearTimer])

  const selectFile = useCallback(async (file) => {
    clearTimer()
    setSending(false)
    if (!file) return

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      fileRef.current = { name: file.name, bytes }
      setFileName(file.name)
      setFrameNumber(0)
      setFrameCount(0)
      setStatus(`Siap mengirim ${file.name} (${bytes.length} byte). Tekan Mulai kirim.`)
    } catch (error) {
      fileRef.current = null
      setFileName(null)
      setStatus('Gagal membaca file: ' + error.message)
    }
  }, [clearTimer])

  const start = useCallback(async () => {
    const file = fileRef.current
    if (!file) {
      setStatus('Pilih file dulu.')
      return
    }

    clearTimer()
    setStatus('Menyiapkan...')

    try {
      const { frames } = await buildTransfer(file.name, file.bytes, chunkSize)
      framesRef.current = frames
      indexRef.current = 0
      setFrameCount(frames.length)
      drawFrame(0)
      setSending(true)
      setStatus(`QR 1 dari ${frames.length} • berulang otomatis sampai penerima selesai.`)

      timerRef.current = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % framesRef.current.length
        drawFrame(indexRef.current)
        setStatus(`QR ${indexRef.current + 1} dari ${framesRef.current.length} • berulang otomatis sampai penerima selesai.`)
      }, 1000 / Math.max(1, fps))
    } catch (error) {
      setSending(false)
      setStatus('Gagal: ' + error.message)
    }
  }, [chunkSize, clearTimer, drawFrame, fps])

  useEffect(() => clearTimer, [clearTimer])

  return {
    canvasRef,
    fileName,
    status,
    sending,
    chunkSize,
    setChunkSize,
    fps,
    setFps,
    frameNumber,
    frameCount,
    selectFile,
    start,
    stop,
  }
}
