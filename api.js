// ============================================================================
// 공통 API 모듈 — index.html, stamp.html 이 같이 사용해요.
//   JejuApi.load()  →  Promise<장소 배열>   (API 우선, 실패하면 data.js 로 대체)
//   JejuApi.source  →  'api' | 'local' | 'fallback'
// 두 데이터(위치정보 + 일반정보)를 '데이터 고유번호'로 합쳐 항상 같은 모양으로 돌려줘요.
// ============================================================================
(function () {
  const cfg = window.JEJU_API_CONFIG || {}

  const str = (v) => (v === null || v === undefined ? '' : String(v).trim())
  const none = (v) => (str(v) === '해당없음' ? '' : str(v))

  // 공공데이터포털(ODcloud) 응답 { page, perPage, totalCount, data: [...] } 을 끝까지 읽어요.
  async function fetchAll(baseUrl) {
    let key = cfg.serviceKey
    if (key && key.includes('%')) { try { key = decodeURIComponent(key) } catch { /* 그대로 */ } }

    const rows = []
    let total = Infinity
    for (let page = 1; rows.length < total && page <= 20; page++) {
      const url = new URL(baseUrl)
      url.searchParams.set('page', page)
      url.searchParams.set('perPage', cfg.perPage || 500)
      url.searchParams.set('returnType', 'JSON')
      url.searchParams.set('serviceKey', key) // URLSearchParams 가 알아서 인코딩해요

      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!Array.isArray(json.data)) throw new Error(json.msg || json.message || '예상과 다른 응답')
      rows.push(...json.data)
      total = typeof json.totalCount === 'number' ? json.totalCount : rows.length
      if (json.data.length === 0) break
    }
    return rows
  }

  // API 두 건 → 화면에서 쓰는 한 건으로 합치기 (CSV 열 이름 = API 필드 이름)
  function merge(locRows, genRows) {
    const gen = new Map(genRows.map((g) => [str(g['데이터 고유번호']), g]))
    return locRows
      .map((l) => {
        const g = gen.get(str(l['데이터 고유번호'])) || {}
        return {
          id: Number(l['데이터 고유번호']),
          name: str(l['장소명']),
          lat: parseFloat(l['위도']),
          lng: parseFloat(l['경도']),
          zip: str(l['우편번호']),
          address: str(l['위치']),
          url: str(l['데이터 상세보기 URL']),
          category: str(g['분류']),
          dir1: str(g['디렉토리1']),
          dir2: str(g['디렉토리2']),
          title: none(g['제목']),
          subtitle: none(g['부제목']),
          author: none(g['저작자']),
          subject: none(g['주제']),
          content: none(g['내용']),
          publisher: none(g['발행자']),
          issued: none(g['발행일']),
          type: none(g['자료유형']),
          baseDate: str(l['데이터기준일자']),
        }
      })
      .filter((d) => Number.isFinite(d.id) && Number.isFinite(d.lat) && Number.isFinite(d.lng))
  }

  // 화면 왼쪽 아래에 "지금 데이터를 어디서 가져왔는지" 알려 주는 작은 표시
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
      const configured = cfg.serviceKey && cfg.locationUrl && cfg.generalUrl

      if (!configured) {
        badge('local', '📦 내장 데이터 사용 중 (config.js 에 API 주소·키를 넣으면 API로 전환)')
        return local()
      }
      try {
        const [locRows, genRows] = await Promise.all([fetchAll(cfg.locationUrl), fetchAll(cfg.generalUrl)])
        const merged = merge(locRows, genRows)
        if (merged.length === 0) throw new Error('받아온 데이터가 비어 있어요')
        this.source = 'api'
        badge('api', `📡 API에서 ${merged.length}건 불러옴`)
        return merged
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
