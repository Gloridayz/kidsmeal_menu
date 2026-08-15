-- 어린이집 식단표 관리 앱 - Supabase 스키마
-- Supabase 대시보드의 SQL Editor에서 이 파일 전체를 실행하세요.

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  lunch text,
  morning_snack text,
  afternoon_snack text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menus_date_idx on public.menus (date);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists menus_set_updated_at on public.menus;
create trigger menus_set_updated_at
  before update on public.menus
  for each row
  execute function public.set_updated_at();

-- Row Level Security: 누구나 조회 가능(로그인 불필요), 쓰기는 서버(service role)에서만 수행
alter table public.menus enable row level security;

drop policy if exists "Public read access" on public.menus;
create policy "Public read access"
  on public.menus
  for select
  to anon, authenticated
  using (true);

-- insert/update/delete 정책을 만들지 않음 -> anon/authenticated 키로는 쓰기 불가.
-- 관리자 업로드 API는 SUPABASE_SERVICE_ROLE_KEY를 사용해 RLS를 우회하여 저장합니다.
