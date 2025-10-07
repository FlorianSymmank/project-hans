-- Tabelle erstellen
create table ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  tags text[] default '{}',
  archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security aktivieren
alter table ideas enable row level security;

-- Beide User können alles sehen
create policy "Users can view all ideas"
  on ideas for select
  using (true);

-- Beide User können Ideen erstellen
create policy "Users can insert ideas"
  on ideas for insert
  with check (auth.uid() is not null);

-- Beide User können alles bearbeiten
create policy "Users can update all ideas"
  on ideas for update
  using (auth.uid() is not null);

-- Beide User können alles löschen
create policy "Users can delete all ideas"
  on ideas for delete
  using (auth.uid() is not null);