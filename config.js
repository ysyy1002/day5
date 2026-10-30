// ============================================================================
// API 설정 — 여기만 고치면 index.html 과 stamp.html 이 모두 같은 API를 사용해요.
// ============================================================================
//
// 공공데이터포털(data.go.kr)에서 "제주특별자치도_제주역사문화위치정보",
// "제주특별자치도_제주역사문화일반정보" 두 데이터를 활용신청한 뒤
//   마이페이지 > 데이터활용 > Open API > 활용신청 현황 > (해당 API) 에서
//   · 일반 인증키(Decoding)  → serviceKey
//   · Swagger / 요청주소      → locationUrl, generalUrl
// 을 복사해 아래에 붙여넣으세요.
//
// 주소는 보통 이런 모양이에요 (쿼리스트링 ? 뒤는 빼고 붙여넣기):
//   https://api.odcloud.kr/api/15xxxxxxx/v1/uddi:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//
// 값을 비워 두거나 API 호출이 실패하면, 같은 폴더의 data.js(내장 데이터)로 자동 전환돼요.
//
// ⚠️ 이 파일은 브라우저에서 그대로 보여요. 공개 사이트에 올릴 때는 인증키가 노출되니 주의하세요.
window.JEJU_API_CONFIG = {
  serviceKey: "82328ad46f24a425bc2d35a4988e20f239b23fe0e879057b6d3c38a93f4a1e13",   // 일반 인증키(Decoding)
  locationUrl: "https://infuser.odcloud.kr/oas/docs?namespace=15109570/v1",  // 제주역사문화 위치정보 API 주소
  generalUrl: "https://infuser.odcloud.kr/oas/docs?namespace=15109587/v1",   // 제주역사문화 일반정보 API 주소
  perPage: 500,     // 한 번에 가져올 건수 (두 데이터 모두 120건이라 1번에 끝나요)
}
