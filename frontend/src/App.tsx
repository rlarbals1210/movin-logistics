import { useState } from 'react'

type Role = 'shipper' | 'carrier'

export default function App() {
  const [role, setRole] = useState<Role>('carrier')

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* 역할 전환 — 데모용 토글. 화면은 features/ 아래에서 채운다 */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-lg font-black tracking-tight">MOVIN</span>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRole('shipper')}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              role === 'shipper' ? 'bg-white shadow' : 'text-slate-500'
            }`}
          >
            화주
          </button>
          <button
            type="button"
            onClick={() => setRole('carrier')}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              role === 'carrier' ? 'bg-white shadow' : 'text-slate-500'
            }`}
          >
            운송인
          </button>
        </div>
      </header>

      <main className="p-4">
        {role === 'shipper' ? (
          // TODO(다현): features/shipper/ 화면으로 교체
          <div className="text-slate-400">화주 화면</div>
        ) : (
          // TODO(규민): features/carrier/ 화면으로 교체
          <div className="text-slate-400">운송인 화면</div>
        )}
      </main>
    </div>
  )
}
