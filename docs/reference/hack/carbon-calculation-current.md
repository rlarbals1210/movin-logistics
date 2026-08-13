# 현재 탄소 배출 감축량 산정식

2026-08-13 사용자 확인으로 교체된 현재 구현 기준이다. 이 문서의 산식은 기존 `carbon-emissions-methodology.docx`보다 우선한다.

## 산정식

```text
ΔE = E_baseline − E_matched

E_baseline = D × EF_empty + (D × EF_loaded + D_dh × EF_empty)

E_matched = D × EF_loaded

ΔE = D × EF_empty + D_dh × EF_empty
```

## 정의

- `E_baseline`: 원래 공차 주행과 그 화물을 별도 차량이 운송했을 때의 배출
- `E_matched`: 같은 차량이 매칭 구간을 적재 상태로 주행한 배출
- `D`: 매칭된 구간 거리(km)
- `D_dh`: 별도 차량이었다면 필요했을 접근 공차거리(km)
- `EF_empty`: 공차 상태의 vehicle·km 기준 배출계수
- `EF_loaded`: 적재 상태의 vehicle·km 기준 배출계수

## 화면 표시 규칙

- 총 감축량: 오더별 `ΔE`의 합
- 건당 감축: 해당 오더의 `ΔE`
- 감축률: `ΔE ÷ E_baseline × 100`
- `D`, `D_dh`, 차량별 `EF_empty`, `EF_loaded`가 없으면 임의 값을 만들지 않고 `산정 대기`로 표시한다.
