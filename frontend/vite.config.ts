import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // 루트 .env의 KAKAOMAP_API_KEY를 클라이언트 번들에서 Kakao JS SDK 앱 키로 사용한다.
  envDir: '..',
  envPrefix: ['VITE_', 'KAKAOMAP_'],
  plugins: [react(), tailwindcss()],
  server: {
    // 5174 고정. strictPort 로 포트가 물려 있으면 5175 로 도망가지 않고 그냥 죽는다 —
    // 데모 중에 주소가 바뀌는 것보다 안 뜨는 게 낫다.
    port: 5174,
    strictPort: true,
    // VITE_API_BASE 가 없으면 API_BASE 는 빈 문자열이라 요청이 dev 서버로 간다.
    // 로컬 uvicorn 으로 넘겨준다 — 배포에서는 VITE_API_BASE 가 Railway 를 가리키고
    // 이 프록시는 타지 않는다.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/v1': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
})
