/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly KAKAOMAP_API_KEY?: string
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
