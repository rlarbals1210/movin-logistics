/**
 * POST /api/insights — 화면이 계산한 사실을 자연어 설명으로 변환한다.
 */
export const config = { runtime: 'edge' }

type Audience = 'SHIPPER' | 'CARRIER'

interface InsightRequest {
  schemaVersion?: unknown
  audience?: unknown
  facts?: unknown
}

interface GeminiPart {
  text?: unknown
  thought?: unknown
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
  }>
}

declare const process: {
  env: Record<string, string | undefined>
}

const EMPTY_RESPONSE = { text: '' }
const DEFAULT_MODEL = 'gemini-flash-latest'
const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseAudience(value: unknown): Audience | null {
  return value === 'SHIPPER' || value === 'CARRIER' ? value : null
}

function buildPrompt(audience: Audience, facts: unknown): string {
  const audienceRules =
    audience === 'SHIPPER'
      ? [
          '대상은 화주입니다. 조건별 차이와 배차 판단에 도움이 되는 핵심 사실을 명확하게 설명하십시오.',
          '최대 2문단, 전체 220자 이내로 작성하십시오.',
        ]
      : [
          '대상은 운송인입니다. 후보 간 예상 실수령과 운행시간의 관계만 간결하게 설명하십시오.',
          '어떤 후보를 선택하라거나 추천한다는 지시·권유·결론을 절대 쓰지 마십시오.',
          '운임, 공차거리, 태그 등 실수령과 운행시간 이외의 항목은 언급하지 마십시오.',
          '2~3문장, 전체 160자 이내로 작성하십시오.',
        ]

  return [
    '아래 JSON 사실을 사람이 읽기 쉬운 한국어 본문으로 바꾸십시오.',
    ...audienceRules,
    '',
    '반드시 지킬 규칙:',
    '- 제공된 사실에 있는 값만 사용하고, 새 수치를 만들거나 값 사이의 차이·합계 등 어떤 수치도 계산하지 마십시오.',
    '- 제공된 사실에 없는 경력, 안전 기록, 귀가 가능성, 거래 이력을 언급하지 마십시오.',
    '- 확률은 백분율로 소수 첫째 자리까지 표현하십시오. 예: 0.068은 6.8%입니다.',
    '- 금액은 원 단위 숫자를 그대로 쓰고 다른 단위로 환산하지 마십시오.',
    '- 분 단위 값은 분 그대로 쓰고 시간으로 환산하지 마십시오.',
    '- 음수 차이는 부호를 쓰지 말고 줄어듭니다, 낮아집니다처럼 말로 방향을 표현하십시오.',
    '- 마크다운, 제목, 목록 없이 본문만 출력하십시오.',
    '',
    `사실(JSON): ${JSON.stringify(facts)}`,
  ].join('\n')
}

function addNumberVariants(allowed: Set<string>, value: number): void {
  if (!Number.isFinite(value)) return

  const add = (candidate: number): void => {
    if (!Number.isFinite(candidate)) return
    allowed.add(String(Object.is(candidate, -0) ? 0 : candidate))
    allowed.add(String(Number(candidate.toFixed(1))))
  }

  const variants = value < 0 ? [value, Math.abs(value)] : [value]

  for (const variant of variants) {
    add(variant)

    if (variant >= 0 && variant <= 1) {
      const percentage = variant * 100
      add(percentage)
      add(Math.round(percentage))
    }
  }
}

function collectAllowedNumbers(facts: unknown): Set<string> {
  const allowed = new Set<string>()

  const visit = (value: unknown): void => {
    if (typeof value === 'number') {
      addNumberVariants(allowed, value)
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }

    if (isRecord(value)) {
      for (const item of Object.values(value)) visit(item)
    }
  }

  visit(facts)
  return allowed
}

function containsUnapprovedNumber(text: string, allowed: Set<string>): boolean {
  const numberPattern =
    /[-+]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?/g

  for (const match of text.matchAll(numberPattern)) {
    const raw = match[0]
    const withoutCommas = raw.replaceAll(',', '')

    // 한 자리 정수는 문장 순서 표현일 수 있으므로 검증에서 제외한다.
    if (/^[-+]?\d$/.test(withoutCommas)) continue

    const parsed = Number(withoutCommas)
    if (!Number.isFinite(parsed)) return true

    const normalized = String(Object.is(parsed, -0) ? 0 : parsed)
    if (!allowed.has(normalized)) return true
  }

  return false
}

function extractText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''

  return parts
    .filter((part) => part.thought !== true && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('')
    .trim()
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    })
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return Response.json(EMPTY_RESPONSE)

  let aiTimeout: ReturnType<typeof setTimeout> | undefined
  try {
    const body: unknown = await req.json()
    if (!isRecord(body)) return Response.json(EMPTY_RESPONSE)

    const { audience: audienceValue, facts } = body as InsightRequest
    const audience = parseAudience(audienceValue)
    if (!audience || !isRecord(facts)) return Response.json(EMPTY_RESPONSE)

    const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL
    const controller = new AbortController()
    aiTimeout = setTimeout(() => controller.abort(), 7_000)
    const response = await fetch(
      `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: buildPrompt(audience, facts) }] },
          ],
          generationConfig: {
            maxOutputTokens: 3000,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: controller.signal,
      },
    )
    if (!response.ok) return Response.json(EMPTY_RESPONSE)

    const payload = (await response.json()) as GeminiResponse
    const text = extractText(payload)

    if (containsUnapprovedNumber(text, collectAllowedNumbers(facts))) {
      return Response.json({ text: '', rejected: true })
    }

    return Response.json({ text })
  } catch {
    return Response.json(EMPTY_RESPONSE)
  } finally {
    if (aiTimeout !== undefined) clearTimeout(aiTimeout)
  }
}
