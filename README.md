# 어린이집 식단표 관리 앱

한 달에 한 번 식단표(사진/PDF)를 업로드하면 Claude API가 날짜별 메뉴(점심/오전간식/오후간식)를 자동으로 인식해 Supabase에 저장합니다. 저장된 식단은 로그인 없이 공유 링크로 누구나 일간/주간/월간 캘린더로 조회할 수 있고, 홈 화면에 앱처럼 추가할 수 있는 PWA로 동작합니다.

## 기능

- **관리자 업로드 (`/admin`)**: PIN으로 보호. 식단표 이미지 또는 PDF와 연/월을 입력하면 Claude가 즉시 인식해 확인 절차 없이 Supabase에 저장합니다.
- **공개 조회 (`/`)**: 로그인 없이 접근 가능한 캘린더. 일간/주간/월간 뷰 전환.
- **PWA**: 홈 화면에 아이콘 추가, 오프라인에서도 마지막으로 본 화면 셸 표시.

## 기술 스택

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase (Postgres + RLS) — 데이터 저장
- Anthropic Claude API (`@anthropic-ai/sdk`) — 식단표 이미지/PDF 인식
- `jose` — 관리자 세션 쿠키 서명(JWT)

## 1. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 생성합니다.
2. 프로젝트의 **SQL Editor**에서 `supabase/schema.sql` 파일 내용을 그대로 실행합니다.
   - `menus` 테이블 생성, RLS 활성화, "누구나 조회 가능" 정책까지 한 번에 설정됩니다.
   - 쓰기(insert/update) 정책은 만들지 않습니다 — 업로드 API가 `service_role` 키로 RLS를 우회해서 저장하기 때문에, anon 키로는 절대 데이터를 수정할 수 없습니다.
3. **Project Settings > API**에서 다음 값을 확인합니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트에 노출하지 마세요)

## 2. Anthropic API 키 발급

[console.anthropic.com](https://console.anthropic.com) 에서 API 키를 발급받아 `ANTHROPIC_API_KEY`로 설정합니다.

## 3. 환경변수 설정

`.env.example`을 `.env.local`로 복사한 뒤 값을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon(public) 키 — 공개 조회용 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 — 서버에서만 사용, 절대 노출 금지 |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `ANTHROPIC_MODEL` | (선택) 사용할 모델, 기본값 `claude-sonnet-5` |
| `ADMIN_PIN` | `/admin` 업로드 페이지 접근용 PIN |
| `ADMIN_SESSION_SECRET` | 관리자 세션 쿠키 서명용 무작위 문자열 (`openssl rand -hex 32`로 생성 권장) |

## 4. 로컬 실행

```bash
npm install
npm run dev
```

- 공개 조회: http://localhost:3000
- 관리자 업로드: http://localhost:3000/admin (PIN 입력 필요)

## 5. Vercel 배포

1. 이 저장소를 GitHub에 푸시한 뒤 [Vercel](https://vercel.com/new)에서 Import 합니다. (Next.js는 자동으로 인식됩니다.)
2. Vercel 프로젝트의 **Settings > Environment Variables**에 위 표의 환경변수를 모두 등록합니다.
3. Deploy를 실행하면 배포가 완료됩니다. 배포된 URL(`https://your-app.vercel.app`)이 곧 조회용 공유 링크입니다.
4. 업로드 파일 용량에 대한 참고: Vercel Serverless Function은 요청 본문 크기 제한이 있습니다. 스마트폰으로 찍은 원본 사진이 너무 큰 경우(수십 MB) 업로드가 실패할 수 있으니, 너무 큰 사진은 압축하거나 PDF 스캔본을 사용하는 것을 권장합니다(코드상 15MB로 제한되어 있습니다).

## 6. 사용 방법

1. `/admin`에서 PIN으로 로그인합니다.
2. 연도/월을 선택하고 식단표 사진 또는 PDF를 업로드합니다.
3. Claude가 날짜별 점심/오전간식/오후간식을 자동 인식해 즉시 Supabase에 저장합니다(별도 확인 절차 없음).
4. 저장이 끝나면 저장된 날짜 목록이 화면에 표시됩니다.
5. `/`(홈)에서 누구나 로그인 없이 일간/주간/월간 뷰로 식단을 확인할 수 있습니다. 이 URL을 학부모들에게 공유하면 됩니다.
6. 모바일 브라우저에서 "홈 화면에 추가"를 하면 앱처럼 아이콘이 생성됩니다(PWA).

## 폴더 구조 참고

- `supabase/schema.sql` — DB 스키마 및 RLS 정책
- `src/lib/anthropic.ts` — Claude API로 식단표 인식하는 로직
- `src/lib/auth.ts`, `src/middleware.ts` — 관리자 PIN 인증 및 세션 보호
- `src/app/api/admin/upload/route.ts` — 업로드 → Claude 인식 → Supabase 저장 API
- `src/components/calendar/` — 일간/주간/월간 캘린더 UI
- `public/manifest.json`, `public/sw.js` — PWA 설정
