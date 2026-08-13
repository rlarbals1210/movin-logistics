/**
 * POST /api/insights — Gemini 한 줄 코멘트.
 *
 * 지금은 스텁이다. 빈 문자열만 돌려준다.
 * 점심(/mv-lunch)에 GEMINI_API_KEY · GEMINI_MODEL 로 실제 호출을 채운다.
 */
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // TODO(점심): Gemini 호출로 교체
  return Response.json({ text: '' })
}
