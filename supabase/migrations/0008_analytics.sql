-- Analytics tables: testimonial_views, testimonial_shares, project_views
-- Safe to run multiple times (use IF NOT EXISTS)

-- testimonial_views: per-testimonial view events
create table if not exists public.testimonial_views (
    id uuid primary key default gen_random_uuid(),
    testimonial_id uuid not null,
    project_id uuid not null,
    visitor_id text null,
    ip_address text null,
    user_agent text null,
    referrer text null,
    country text null,
    created_utc timestamptz not null default now()
);

create index if not exists idx_testimonial_views_project_created on public.testimonial_views (project_id, created_utc);
create index if not exists idx_testimonial_views_testimonial on public.testimonial_views (testimonial_id);

-- testimonial_shares: share events by platform
create table if not exists public.testimonial_shares (
    id uuid primary key default gen_random_uuid(),
    testimonial_id uuid not null,
    project_id uuid not null,
    platform text not null,
    visitor_id text null,
    created_utc timestamptz not null default now()
);

create index if not exists idx_testimonial_shares_project_created on public.testimonial_shares (project_id, created_utc);
create index if not exists idx_testimonial_shares_testimonial on public.testimonial_shares (testimonial_id);

-- project_views: embed wall/page views per project
create table if not exists public.project_views (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null,
    visitor_id text null,
    ip_address text null,
    user_agent text null,
    referrer text null,
    created_utc timestamptz not null default now()
);

create index if not exists idx_project_views_project_created on public.project_views (project_id, created_utc);
