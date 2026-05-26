-- ============================================================
-- JV StackBuild – Initial Database Schema
-- Run this in the Supabase SQL Editor or via supabase db push
-- ============================================================

-- -------------------------
-- PROJECTS
-- -------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  client_name   text,
  address       text,
  city          text,
  state         text,
  zip           text,
  project_type  text default 'Commercial',
  status        text default 'active'
                  check (status in ('active','bidding','awarded','complete','on_hold')),
  bid_date      date,
  start_date    date,
  end_date      date,
  description   text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- -------------------------
-- TAKEOFF ITEMS
-- -------------------------
create table if not exists public.takeoff_items (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete cascade not null,
  division    text not null,
  description text not null,
  quantity    numeric not null default 0 check (quantity >= 0),
  unit        text not null default 'SF',
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- -------------------------
-- ESTIMATES
-- -------------------------
create table if not exists public.estimates (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references public.projects(id) on delete cascade not null,
  name             text not null,
  status           text default 'draft'
                     check (status in ('draft','submitted','approved','rejected')),
  overhead_percent numeric default 10 check (overhead_percent >= 0 and overhead_percent <= 100),
  profit_percent   numeric default 10 check (profit_percent >= 0 and profit_percent <= 100),
  notes            text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- -------------------------
-- ESTIMATE LINE ITEMS
-- -------------------------
create table if not exists public.estimate_line_items (
  id                  uuid primary key default gen_random_uuid(),
  estimate_id         uuid references public.estimates(id) on delete cascade not null,
  takeoff_item_id     uuid references public.takeoff_items(id) on delete set null,
  division            text,
  description         text not null,
  quantity            numeric not null default 0 check (quantity >= 0),
  unit                text not null default 'SF',
  material_unit_cost  numeric default 0 check (material_unit_cost >= 0),
  labor_unit_cost     numeric default 0 check (labor_unit_cost >= 0),
  subcontractor_cost  numeric default 0 check (subcontractor_cost >= 0),
  notes               text,
  created_at          timestamptz default now() not null
);

-- -------------------------
-- INDEXES
-- -------------------------
create index if not exists idx_projects_user_id        on public.projects(user_id);
create index if not exists idx_projects_status         on public.projects(status);
create index if not exists idx_takeoff_project_id      on public.takeoff_items(project_id);
create index if not exists idx_takeoff_division        on public.takeoff_items(division);
create index if not exists idx_estimates_project_id    on public.estimates(project_id);
create index if not exists idx_estimate_lines_est_id   on public.estimate_line_items(estimate_id);

-- -------------------------
-- AUTO-UPDATE updated_at
-- -------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create or replace trigger trg_takeoff_items_updated_at
  before update on public.takeoff_items
  for each row execute function public.handle_updated_at();

create or replace trigger trg_estimates_updated_at
  before update on public.estimates
  for each row execute function public.handle_updated_at();

-- -------------------------
-- ROW LEVEL SECURITY
-- -------------------------
alter table public.projects           enable row level security;
alter table public.takeoff_items      enable row level security;
alter table public.estimates          enable row level security;
alter table public.estimate_line_items enable row level security;

-- Projects: users see and manage only their own
create policy "projects_select" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update" on public.projects for update using (auth.uid() = user_id);
create policy "projects_delete" on public.projects for delete using (auth.uid() = user_id);

-- Takeoff items: accessible if user owns the parent project
create policy "takeoff_select" on public.takeoff_items for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "takeoff_insert" on public.takeoff_items for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "takeoff_update" on public.takeoff_items for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "takeoff_delete" on public.takeoff_items for delete
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

-- Estimates: accessible if user owns the parent project
create policy "estimates_select" on public.estimates for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "estimates_insert" on public.estimates for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "estimates_update" on public.estimates for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "estimates_delete" on public.estimates for delete
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

-- Estimate line items: accessible if user owns the parent estimate's project
create policy "estimate_lines_select" on public.estimate_line_items for select
  using (exists (
    select 1 from public.estimates e
    join public.projects p on p.id = e.project_id
    where e.id = estimate_id and p.user_id = auth.uid()
  ));
create policy "estimate_lines_insert" on public.estimate_line_items for insert
  with check (exists (
    select 1 from public.estimates e
    join public.projects p on p.id = e.project_id
    where e.id = estimate_id and p.user_id = auth.uid()
  ));
create policy "estimate_lines_update" on public.estimate_line_items for update
  using (exists (
    select 1 from public.estimates e
    join public.projects p on p.id = e.project_id
    where e.id = estimate_id and p.user_id = auth.uid()
  ));
create policy "estimate_lines_delete" on public.estimate_line_items for delete
  using (exists (
    select 1 from public.estimates e
    join public.projects p on p.id = e.project_id
    where e.id = estimate_id and p.user_id = auth.uid()
  ));
