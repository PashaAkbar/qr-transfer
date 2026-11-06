import { useSender } from '../hooks/useSender.js'

export default function SendPanel() {
  const sender = useSender()

  return (
    <section className="card">
      <label htmlFor="file">File yang dikirim</label>
      <input
        id="file"
        type="file"
        onChange={(event) => sender.selectFile(event.target.files?.[0])}
      />

      <div className="row">
        <div>
          <label htmlFor="sz">Isi per QR</label>
          <select
            id="sz"
            value={sender.chunkSize}
            onChange={(event) => sender.setChunkSize(Number(event.target.value))}
            disabled={sender.sending}
          >
            <option value={300}>300 byte (mudah dibaca)</option>
            <option value={600}>600 byte</option>
            <option value={1000}>1000 byte (cepat)</option>
          </select>
        </div>
        <div>
          <label htmlFor="fps">Kecepatan</label>
          <select
            id="fps"
            value={sender.fps}
            onChange={(event) => sender.setFps(Number(event.target.value))}
            disabled={sender.sending}
          >
            <option value={2}>2 QR/detik</option>
            <option value={4}>4 QR/detik</option>
            <option value={8}>8 QR/detik</option>
          </select>
        </div>
      </div>

      <button className="btn" onClick={sender.start} hidden={sender.sending}>
        Mulai kirim
      </button>
      <button className="btn alt" onClick={sender.stop} hidden={!sender.sending}>
        Hentikan
      </button>

      <canvas ref={sender.canvasRef} className="qr" hidden={!sender.sending} />

      <p className="st">{sender.status}</p>
    </section>
  )
}
