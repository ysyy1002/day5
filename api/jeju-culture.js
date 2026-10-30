// Vercel 서버리스 함수: 공공데이터포털 "제주역사문화 위치정보 + 일반정보"를 합쳐서 돌려줘요.
// 환경변수: DATA_GO_KR_KEY  → 공공데이터포털 '일반 인증키(Decoding)'  (VITE_ 접두사 없음, 브라우저에 노출되지 않아요)
//   Vercel 대시보드 > Project > Settings > Environment Variables 에 등록하세요.

const BASE = 'https://api.odcloud.kr/api'
const LOCATION = `${BASE}/15109570/v1/uddi:8781448b-81a8-487c-bc95-d26335bafa82` // 제주특별자치도_제주역사문화위치정보
const GENERAL = `${BASE}/15109587/v1/uddi:56c2b3a4-4b4b-46cd-a1fa-f928ef731ffb` // 제주특별자치도_제주역사문화일반정보

const str = (v) => (v === null || v === undefined ? '' : String(v).trim())
const none = (v) => (str(v) === '해당없음' ? '' : str(v))

// ODcloud 응답 { totalCount, data: [...] } 을 끝까지 읽는다.
async function fetchAll(baseUrl, key) {
  const rows = []
  let total = Infinity
  for (let page = 1; rows.length < total && page <= 20; page++) {
    const url = new URL(baseUrl)
    url.searchParams.set('page', page)
    url.searchParams.set('perPage', 500)
    url.searchParams.set('returnType', 'JSON')
    url.searchParams.set('serviceKey', key) // 인코딩은 URLSearchParams 가 해줘요

    const res = await fetch(url)
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { throw new Error(`공공데이터포털 응답을 해석하지 못했어요 (HTTP ${res.status})`) }
    if (!res.ok || !Array.isArray(json.data)) throw new Error(json.msg || json.message || `공공데이터포털 오류 (HTTP ${res.status})`)

    rows.push(...json.data)
    total = typeof json.totalCount === 'number' ? json.totalCount : rows.length
    if (json.data.length === 0) break
  }
  return rows
}

// 위치정보 + 일반정보 → 화면에서 쓰는 한 건 ('데이터 고유번호'로 합치기)
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

// Encoding 키(%2B 같은 퍼센트 인코딩 포함)를 넣었더라도 동작하도록 한 번 풀어 준다.
const decodeKey = (k) => {
  if (k && k.includes('%')) { try { return decodeURIComponent(k) } catch { /* 그대로 사용 */ } }
  return k
}

module.exports = async function handler(req, res) {
  // 공공데이터포털 인증키는 계정 하나로 두 API 모두 쓸 수 있어서 보통 DATA_GO_KR_KEY 하나면 돼요.
  // API 마다 다른 키를 쓰고 싶으면 DATA_GO_KR_KEY_LOCATION / DATA_GO_KR_KEY_GENERAL 로 따로 등록할 수도 있어요.
  const locationKey = decodeKey(process.env.DATA_GO_KR_KEY_LOCATION || process.env.DATA_GO_KR_KEY)
  const generalKey = decodeKey(process.env.DATA_GO_KR_KEY_GENERAL || process.env.DATA_GO_KR_KEY)
  if (!locationKey || !generalKey) {
    const missing = [!locationKey && '위치정보(DATA_GO_KR_KEY_LOCATION 또는 DATA_GO_KR_KEY)', !generalKey && '일반정보(DATA_GO_KR_KEY_GENERAL 또는 DATA_GO_KR_KEY)'].filter(Boolean).join(', ')
    return res.status(500).json({ code: 'NO_KEY', error: `인증키 환경변수가 없어요: ${missing}` })
  }

  try {
    const [locRows, genRows] = await Promise.all([fetchAll(LOCATION, locationKey), fetchAll(GENERAL, generalKey)])
    const rows = merge(locRows, genRows)
    if (rows.length === 0) return res.status(502).json({ code: 'EMPTY', error: '받아온 데이터가 비어 있어요.' })
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600') // 데이터가 자주 안 바뀌니 하루 캐시
    return res.status(200).json({ count: rows.length, rows })
  } catch (e) {
    return res.status(502).json({ code: 'UPSTREAM', error: String(e.message || e) })
  }
}

// 테스트에서 쓰려고 내보내요 (Vercel 은 기본 내보내기만 사용)
module.exports.merge = merge
