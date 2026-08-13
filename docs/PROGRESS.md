# PROGRESS

## 09:30 — 레포 초기 구조 (규민)

- frontend: Vite + React 19 + TS + Tailwind v4(@tailwindcss/vite), 역할 전환 App.tsx 뼈대. `pnpm build` 통과.
- 공통 기준 확정: `frontend/src/lib/types.ts` 동결 + `predictions.example.json`(화주_시나리오 15개 / 운송인_추천콜 3건 / 모델지표).
- backend: FastAPI `/health` 만 (로컬 200 확인). api/insights.ts 스텁, vercel.json, ai·design 폴더와 규칙 문서 배치.

## 10:05 — 백엔드 매칭 엔드포인트 (규민)

- 만든 것: `POST /v1/matches/shipper`(시나리오 15개) · `GET /v1/matches/carrier/{id}`(추천콜 3건). 고정값은 `app/fixtures.py` 의 `FIXED_RESPONSE` 한 곳에. CORS 전체 허용, 요청 검증 느슨(extra="allow" · 전부 optional), 없는 값은 `모델버전: null`. 로컬 uvicorn 에서 `/health` 포함 3개 다 200.
- 남은 것: 모델이 없어 요청값을 안 본다(톤급·시간창을 줘도 15개 격자를 통째로 반환). Railway 배포 반영 확인 미실시.
- 다음: `/mv-lunch-a` 에서 추론을 붙이고 `FIXED_RESPONSE` 를 폴백으로 재사용.

## Hack 프로젝트 자료 이전

- 이전 `hack` 작업의 사용자/Codex 대화를 `docs/HACK_CONVERSATIONS.md`로 보관.
- 최종 기획안, 탄소 산정 보고서, 청사진 4장을 `docs/reference/hack/`에 원본 그대로 복사하고 SHA-256으로 확인.
- 구현 판단용 통합 기준을 `docs/PROJECT_KNOWLEDGE.md`에 정리.
- 청사진의 선택형 자동 수락과 최종 기획안이 충돌하므로, 최종 기획안에 따라 자동 수락은 제외.
