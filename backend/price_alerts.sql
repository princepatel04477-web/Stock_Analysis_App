create table public.price_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  company_name text,
  alert_type text not null,
  target_price numeric,
  condition text not null,
  is_triggered boolean default false,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.price_alerts enable row level security;

create policy "Users can manage own alerts"
  on public.price_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
