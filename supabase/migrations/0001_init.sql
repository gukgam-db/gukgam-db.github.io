-- Korea Now 초기 스키마
-- 공공 API 응답을 잠깐 저장해 두는 캐시 테이블 + 관광지 마스터 테이블

-- 1) 관광지 마스터 (앱의 spots.ts와 동일 구조, 관리자 수정용)
create table if not exists public.spots (
  id text primary key,
  name text not null,
  name_ko text not null,
  category text not null,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  fee_adult integer not null default 0,
  fee_note text,
  hours_open text,
  hours_close text,
  hours_note text,
  closed_days smallint[] not null default '{}',
  closed_note text,
  card_ok boolean not null default true,
  english text not null default 'some',
  seoul_area text,
  popularity smallint not null default 3,
  tags text[] not null default '{}',
  tip text,
  fee_checked_at text,
  updated_at timestamptz not null default now()
);

-- 2) 서울 실시간 혼잡도 캐시 (지역명 단위, 5분 TTL은 함수에서 판단)
create table if not exists public.congestion_cache (
  area text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

-- 3) 환율 캐시 (하루 1회)
create table if not exists public.fx_cache (
  day date primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

-- 4) TourAPI 검색 캐시 (쿼리 해시 → 응답, 24시간)
create table if not exists public.tour_cache (
  key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

-- 읽기 전용 공개, 쓰기는 서비스 롤(Edge Function)만
alter table public.spots enable row level security;
alter table public.congestion_cache enable row level security;
alter table public.fx_cache enable row level security;
alter table public.tour_cache enable row level security;

create policy "spots public read" on public.spots for select using (true);
create policy "congestion public read" on public.congestion_cache for select using (true);
create policy "fx public read" on public.fx_cache for select using (true);
create policy "tour public read" on public.tour_cache for select using (true);

-- 5) 공공 API 키 보관 (대시보드 시크릿 대신/보조). RLS 켜고 정책 없음 → 서비스 롤만 읽음
create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
