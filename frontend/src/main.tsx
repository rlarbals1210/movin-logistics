import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { warmUpApi } from './lib/api'

// Railway 콜드스타트 예열. 첫 화면 요청이 30초 걸리는 사고를 막는다.
warmUpApi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
