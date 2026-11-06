import { useReceiver } from '../hooks/useReceiver.js'

export default function ReceivePanel() {
  const recv = useReceiver()

  return (
    <section className="card">
      <button className="btn" style={{ marginTop: 0 }} onClick={recv.running ? recv.stop : recv.start}>
        {recv.running ? 'Hentikan kamera' : 'Buka kamera'}
      </button>

      <video
        ref={recv.videoRef}
        className="video"
        playsInline
        muted
        style={{ display: recv.running ? 'block' : 'none' }}
      />
      <canvas ref={recv.canvasRef} hidden />

      <div className="bar">
        <i style={{ width: `${recv.progress * 100}%` }} />
      </div>

      {recv.total > 0 && (
        <p className="st">
          {recv.received} dari {recv.total} QR
        </p>
      )}

      <p className={recv.downloadUrl ? 'st ok' : 'st'}>{recv.status}</p>

      {recv.downloadUrl && (
        <>
          <a className="btn link" href={recv.downloadUrl} download={recv.fileName ?? 'file'}>
            Simpan file
          </a>
          <button className="btn alt" onClick={recv.start}>
            Terima file lain
          </button>
        </>
      )}
    </section>
  )
}
