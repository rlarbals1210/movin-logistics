import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 5174 고정. strictPort 로 포트가 물려 있으면 5175 로 도망가지 않고 그냥 죽는다 —
    // 데모 중에 주소가 바뀌는 것보다 안 뜨는 게 낫다.
    port: 5174,
    strictPort: true,
  },
})
