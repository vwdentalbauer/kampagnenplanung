-- Entwurf des Supabase-Schemas für Phase 2 (Backend + Auth + Rollen).
-- Noch NICHT ausgeführt – dient als Diskussionsgrundlage.

-- 1) Rollen je Nutzer ------------------------------------------------------
create type rolle as enum ('viewer', 'editor', 'admin');

create table profile (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  rolle       rolle not null default 'viewer',
  freigegeben boolean not null default false, -- Admin-Freigabe (Nutzerverwaltung)
  created_at  timestamptz not null default now()
);

-- 2) Kampagnen -------------------------------------------------------------
create type status as enum ('geplant', 'in_arbeit', 'erledigt', 'abgesagt');

create table kampagne (
  id            uuid primary key default gen_random_uuid(),
  quartal       text,
  kw            int,
  week_start    date,
  zielgruppe    text,
  kanal         text,
  details       text,
  ziel          text,
  kategorie     text,
  bereiche      text[] not null default '{}',
  verantwortung text,
  owners        text[] not null default '{}',
  status        status not null default 'geplant',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id)
);

-- 3) Row Level Security ----------------------------------------------------
alter table kampagne enable row level security;

-- Hilfsfunktion: Rolle des aktuellen Nutzers
create or replace function aktuelle_rolle() returns rolle
language sql stable as $$
  select rolle from profile where id = auth.uid() and freigegeben
$$;

-- Lesen: jeder freigegebene Nutzer (viewer/editor/admin)
create policy "lesen" on kampagne for select
  using (aktuelle_rolle() is not null);

-- Schreiben/Ändern: editor + admin
create policy "schreiben" on kampagne for insert
  with check (aktuelle_rolle() in ('editor', 'admin'));
create policy "aendern" on kampagne for update
  using (aktuelle_rolle() in ('editor', 'admin'));

-- Löschen: nur admin
create policy "loeschen" on kampagne for delete
  using (aktuelle_rolle() = 'admin');

-- Profile darf jeder lesen, aber nur ein Admin die Rolle/Freigabe ändern
alter table profile enable row level security;
create policy "profil lesen" on profile for select using (true);
create policy "profil verwalten" on profile for update
  using ((select rolle from profile where id = auth.uid()) = 'admin');
