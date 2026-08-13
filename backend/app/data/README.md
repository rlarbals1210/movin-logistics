# backend/app/data — 배포용 사본

`predictions.json` 은 **정본이 아니다.** 정본은 `frontend/src/data/predictions.json` 이고
ai 파이프라인이 그 파일을 갱신한다.

Railway 는 `backend/` 만 배포하기 때문에 그 이미지 안에 `frontend/` 가 존재하지 않는다.
레포 상대경로만 보면 배포본이 항상 09:30 고정값으로 떨어진다(실제로 그랬다).
그래서 사본을 여기 커밋해 둔다.

## 정본이 바뀌면 반드시 같이 갱신한다

```bash
cp frontend/src/data/predictions.json backend/app/data/predictions.json
```

로컬에서는 정본이 먼저 잡히므로(`fixtures.py` 후보 순서) 사본이 뒤처져도 로컬 결과는
흔들리지 않는다. 다만 **배포본만 조용히 옛 숫자를 보여주게 되므로** 갱신을 빼먹지 마라.

API 응답의 `모델버전`(파일 해시)으로 두 환경이 같은 파일을 쓰는지 확인할 수 있다.
