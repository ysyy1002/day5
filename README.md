# 양수연 2단계 — Vercel 환경변수로 API 불러오기

`index.html`(조회·지도·찜 코스)과 `stamp.html`(스탬프 투어)이 **같은 `api.js`** 로 데이터를 받아요.
인증키는 브라우저 파일에 두지 않고 **Vercel 환경변수**에만 둬요.

```
브라우저(index/stamp) ──▶ /api/jeju-culture (Vercel 서버리스 함수) ──▶ 공공데이터포털 API 2개
                                  ▲ 환경변수 DATA_GO_KR_KEY (서버에서만 사용)
```

## 파일 구성
| 파일 | 역할 |
|---|---|
| `index.html`, `stamp.html` | 화면 두 개 |
| `api.js` | 공통 API 모듈 (`/api/jeju-culture` 호출, 실패하면 `data.js` 로 대체) |
| `api/jeju-culture.js` | Vercel 서버리스 함수. 두 API 를 호출해 `데이터 고유번호`로 합쳐서 돌려줘요 |
| `data.js` | 내장 데이터(CSV 변환본). API 를 못 쓸 때 사용 |
| `coast.js` | 제주도 해안선(지도 배경) |
| `.vercelignore` | 배포에서 제외할 파일 (`config.js`, `*.csv`) |

연결하는 API (공공데이터포털, 인증키 하나로 둘 다 사용)
- 제주특별자치도_제주역사문화위치정보 (`15109570`)
- 제주특별자치도_제주역사문화일반정보 (`15109587`)

## Vercel 에 올리는 방법
1. 이 폴더(`양수연_2단계`)를 Vercel 프로젝트로 배포해요. (Framework: Other, 빌드 명령 없음)
2. Vercel 대시보드 → Project → **Settings → Environment Variables** 에 등록:

   | Name | Value |
   |---|---|
   | `DATA_GO_KR_KEY` | 공공데이터포털 **일반 인증키(Decoding)** |

   API 마다 인증키를 따로 발급받았다면 위 한 줄 대신 아래 두 개를 등록해요. (따로 등록한 이름이 있으면 그것을 먼저 써요)

   | Name | Value |
   |---|---|
   | `DATA_GO_KR_KEY_LOCATION` | 제주역사문화**위치정보** API 의 인증키(Decoding) |
   | `DATA_GO_KR_KEY_GENERAL` | 제주역사문화**일반정보** API 의 인증키(Decoding) |

   Production / Preview / Development 를 모두 체크하고 저장한 뒤 **Redeploy** 해야 반영돼요.
3. 배포된 주소의 `index.html`, `stamp.html` 을 열면 왼쪽 아래에 **📡 API에서 120건 불러옴** 이 떠요.

로컬에서 API 까지 확인하려면 (Vercel CLI 필요):
```
vercel env pull .env.local     # 또는 DATA_GO_KR_KEY 를 직접 등록
vercel dev
```

## 화면 왼쪽 아래 표시
| 표시 | 뜻 |
|---|---|
| 📡 API에서 120건 불러옴 | 서버 함수가 공공데이터포털 호출에 성공 |
| ⚠️ API 호출 실패 → 내장 데이터 | 환경변수 없음/잘못된 키/공공데이터포털 오류. 표시에 마우스를 올리면 원인이 보여요 |
| 📦 내장 데이터 사용 중 | 파일을 더블클릭해서 연 경우(file://). 서버 함수가 없어서 `data.js` 를 사용 |

## 참고
- 폴더에 남아 있는 `config.js`(예전 방식의 설정 파일)는 **더 이상 사용하지 않아요.** 인증키가 들어 있다면
  배포 전에 지우세요. (`.vercelignore` 가 배포에서는 빼 주지만, 지우는 게 가장 안전해요.)
- 스탬프·찜 기록은 API 와 무관하게 이 브라우저(localStorage)에 저장돼요.
