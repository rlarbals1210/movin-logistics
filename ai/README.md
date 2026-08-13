# ai/ — 모델 담당 (기웅)

## 출력물

`frontend/src/data/predictions.json` **한 개.**

형태는 `frontend/src/data/predictions.example.json` 을 그대로 따른다.
최상위 키 세 개 — `화주_시나리오` · `운송인_추천콜` · `모델지표` — 를 바꾸지 마라.
타입 정의는 `frontend/src/lib/types.ts` 에 동결돼 있고, 화면 두 개가 이 파일을 직접 읽는다.

- `화주_시나리오`: 톤급 5·11·25 × 시간창 40·120·240·480·1440분 = 15개 항목
- `운송인_추천콜`: 3건 이상
- `모델지표`: 수락예측_AUC · 유찰예측_AUC · 학습행수

## 마감

**11:30.** 이 시각에 화면 두 개가 실제 데이터로 갈아탄다.
늦으면 example.json 으로 발표한다.

## 커밋 규칙

- 노트북은 `ai/notebooks/`, 원본·중간 데이터는 `ai/data/`
- **데이터 파일도 반드시 커밋한다.** `ai/data` 는 .gitignore 에서 제외돼 있다.
  다른 사람 노트북에서 그대로 재현돼야 한다.
- 결과 JSON 은 `frontend/src/data/predictions.json` 으로 직접 커밋한다
