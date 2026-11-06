import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Assembler, parseFrame } from '../lib/protocol.js'

const IDLE = 'Arahkan kamera ke QR di layar pengirim dan tahan sampai selesai.'

function safeName(name) {
  const cleaned = String(name || '')
    .replace(/[/\\]/g, '_')
    .trim()
  return cleaned || 'file'
}

export function useReceiver() {
  const [status, setStatus] = useState(IDLE)
  const [progress, setProgress] = useState(0)
  const [received, setReceived] = useState(0)
  const [total, setTotal] = useState(0)
  const [fileName, setFileName] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [running, setRunning] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const runRef = useRef(false)
  const finishedRef = useRef(false)
  const assemblerRef = useRef(new Assembler())
  const detectorRef = useRef(null)
  const lastScanRef = useRef(0)
  const urlRef = useRef(null)

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setDownloadUrl(null)
  }, [])

  const reset = useCallback(() => {
    revokeUrl()
    assemblerRef.current.reset()
    finishedRef.current = false
    setProgress(0)
    setReceived(0)
    setTotal(0)
    setFileName(null)
  }, [revokeUrl])

  const stop = useCallback(() => {
    runRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    const video = videoRef.current
    if (video) video.srcObject = null
    setRunning(false)
  }, [])

  const finish = useCallback(async () => {
    if (finishedRef.current) return
    finishedRef.current = true
    stop()

    try {
      const result = await assemblerRef.current.assemble()
      const name = safeName(result.name)
      const url = URL.createObjectURL(new Blob([result.data]))
      urlRef.current = url
      setFileName(name)
      setDownloadUrl(url)
      setProgress(1)
      setStatus(`Selesai: ${name} (${result.data.length} byte). Checksum cocok.`)
    } catch {
      setProgress(0)
      setStatus('File rusak atau tidak lengkap. Coba terima ulang.')
    }
  }, [stop])

  const handle = useCallback((raw) => {
    if (finishedRef.current) return
    const frame = parseFrame(raw)
    if (!frame) return

    try {
      const added = assemblerRef.current.ingest(frame)
      const assembler = assemblerRef.current
      setTotal(assembler.total)
      setReceived(assembler.received)
      setProgress(assembler.total > 0 ? assembler.received / assembler.total : 0)
      if (assembler.meta) setFileName(assembler.meta.n)

      if (added) {
        const label = assembler.meta ? ` untuk ${assembler.meta.n}` : ''
        setStatus(`Diterima ${assembler.received} dari ${assembler.total} QR${label}.`)
      }

      if (assembler.complete) finish()
    } catch {
      assemblerRef.current.reset()
      setReceived(0)
      setTotal(0)
      setProgress(0)
      setStatus('Aliran QR tidak konsisten. Mulai pindai ulang.')
    }
  }, [finish])

  const scan = useCallback(async () => {
    const video = videoRef.current
    if (!video || !runRef.current) return

    const now = performance.now()
    if (now - lastScanRef.current < 70) {
      requestAnimationFrame(scan)
      return
    }
    lastScanRef.current = now

    try {
      let values = []

      if (detectorRef.current && video.videoWidth) {
        const codes = await detectorRef.current.detect(video)
        values = codes.map((code) => code.rawValue)
      } else if (video.videoWidth) {
        const canvas = canvasRef.current
        const scale = Math.min(1, 800 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(image.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })
        if (result) values = [result.data]
      }

      for (const value of values) {
        if (value && value.startsWith('QF|')) handle(value)
      }
    } catch {
      // Ignore transient frame errors while the camera is warming up.
    }

    if (runRef.current) requestAnimationFrame(scan)
  }, [handle])

  const start = useCallback(async () => {
    reset()
    setStatus('Mencari QR...')

    if (typeof BarcodeDetector !== 'undefined') {
      try {
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] })
      } catch {
        detectorRef.current = null
      }
    } else {
      detectorRef.current = null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      setRunning(true)
      await video.play()
      runRef.current = true
      requestAnimationFrame(scan)
    } catch (error) {
      setStatus('Kamera tidak bisa dibuka (' + error.message + '). Pastikan situs diakses lewat HTTPS.')
      setRunning(false)
    }
  }, [reset, scan])

  useEffect(() => () => {
    runRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  return {
    videoRef,
    canvasRef,
    status,
    progress,
    received,
    total,
    fileName,
    downloadUrl,
    running,
    start,
    stop,
  }
}
