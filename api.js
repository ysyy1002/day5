// ============================================================================
// 공통 API 모듈 — index.html, stamp.html 이 같이 사용해요.
//   JejuApi.load()  →  Promise<장소 배열>   (API 우선, 실패하면 data.js 로 대체)
//   JejuApi.source  →  'api' | 'local' | 'fallback'
//
// 브라우저는 인증키를 모르고, 같은 사이트의 /api/jeju-culture (Vercel 서버리스 함수)만 불러요.
// 인증키(DATA_GO_KR_KEY)는 Vercel 환경변수에 있고, 서버에서만 사용돼요.
// ============================================================================
(function () {
  const ENDPOINT = '/api/jeju-culture'

  // 화면 왼쪽 아래에 "지금 데이터를 어디서 가져왔는지" 알려 주는 작은 표시 (눌러서 닫기)
  function badge(kind, text, detail) {
    const el = document.createElement('div')
    el.textContent = text
    if (detail) el.title = detail
    el.style.cssText =
      'position:fixed;left:.6rem;bottom:.6rem;z-index:50;padding:.3rem .7rem;border-radius:999px;font:12px system-ui,sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;color:#fff;background:' + (kind === 'api' ? '#2f9e44' : kind === 'fallback' ? '#e67700' : '#495057')
    el.onclick = () => el.remove()
    const add = () => document.body.appendChild(el)
    document.body ? add() : document.addEventListener('DOMContentLoaded', add)
  }

  const JejuApi = {
    source: 'local',
    error: null,

    async load() {
      const local = () => window.JEJU_DATA || []

      // 파일을 더블클릭해서 연 경우(file://)에는 서버 함수가 없으니 바로 내장 데이터를 써요.
      if (location.protocol === 'file:') {
        badge('local', '📦 내장 데이터 사용 중 (Vercel에 배포하면 API로 전환)')
        return local()
      }

      try {
        const res = await fetch(ENDPOINT)
        const json = await res.json().catch(() => null)
        if (!res.ok || !json || !Array.isArray(json.rows)) throw new Error((json && json.error) || `HTTP ${res.status}`)
        if (json.rows.length === 0) throw new Error('받아온 데이터가 비어 있어요')
        this.source = 'api'
        badge('api', `📡 API에서 ${json.rows.length}건 불러옴`)
        return json.rows
      } catch (e) {
        this.source = 'fallback'
        this.error = e
        console.warn('[JejuApi] API 호출 실패 → 내장 데이터로 대체:', e)
        badge('fallback', '⚠️ API 호출 실패 → 내장 데이터로 표시 중', String(e.message || e))
        return local()
      }
    },
  }
  window.JejuApi = JejuApi
})()
