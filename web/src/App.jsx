import { useState } from 'react'
import SendPanel from './components/SendPanel.jsx'
import ReceivePanel from './components/ReceivePanel.jsx'

export default function App() {
  const [tab, setTab] = useState('send')

  return (
    <main>
      <h1>QR Transfer File</h1>
      <p className="sub">
        Kirim file antar perangkat lewat QR yang berganti-ganti. Tanpa internet, tanpa server.
      </p>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'send'} onClick={() => setTab('send')}>
          Kirim
        </button>
        <button role="tab" aria-selected={tab === 'recv'} onClick={() => setTab('recv')}>
          Terima
        </button>
      </div>

      {tab === 'send' ? <SendPanel /> : <ReceivePanel />}
    </main>
  )
}
