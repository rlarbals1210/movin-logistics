# PROGRESS

## 09:30 — 레포 초기 구조 (규민)

- frontend: Vite + React 19 + TS + Tailwind v4(@tailwindcss/vite), 역할 전환 App.tsx 뼈대. `pnpm build` 통과.
- 공통 기준 확정: `frontend/src/lib/types.ts` 동결 + `predictions.example.json`(화주_시나리오 15개 / 운송인_추천콜 3건 / 모델지표).
- backend: FastAPI `/health` 만 (로컬 200 확인). api/insights.ts 스텁, vercel.json, ai·design 폴더와 규칙 문서 배치.
