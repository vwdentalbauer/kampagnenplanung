-- Umgesetztes Supabase-Schema (Phase 2) – Stand der Migrationen 01–07.
-- Dies ist die Dokumentation des LIVE-Schemas im Projekt
-- bylcztqahqzsaeztqfov. Änderungen bitte als neue Migration anwenden,
-- nicht diese Datei „nachträglich“ ausführen.

-- =========================================================================
-- 1) Enums & Stammtabellen (Migration 01_kern_schema)
-- =========================================================================
create type rolle  as enum ('viewer', 'editor', 'admin');
create type status as enum ('geplant', 'in_arbeit', 'erledigt', 'abgesagt');

-- Profil je Auth-Nutzer (Rolle + Freischaltung)
create table profile (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text not null default '',
  rolle       rolle not null default 'viewer',
  aktiv       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Beim Anlegen eines Auth-Nutzers automatisch ein Profil erzeugen.
-- Nur vom Admin angelegte Nutzer (Rolle in den Metadaten gesetzt) sind aktiv;
-- etwaige Selbst-Registrierungen bleiben inaktiv = ohne Zugriff.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_rolle rolle := (new.raw_user_meta_data ->> 'rolle')::rolle;
begin
  insert into public.profile (id, email, name, rolle, aktiv)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data ->> 'name', ''),
          coalesce(v_rolle, 'viewer'),
          (v_rolle is not null))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- Kampagnen (eine Zeile = eine Maßnahme)
create table kampagne (
  id            text primary key,
  land          text not null default 'DE',
  quartal       text not null default '',
  kw            int,
  week_start    date,
  end_datum     date,
  zielgruppe    text not null default '',
  kanal         text not null default '',
  sub_kanal     text not null default '',
  kampagne      text not null default '',
  details       text not null default '',
  ziel          text not null default '',
  kategorie     text not null default '',
  bereiche      text[] not null default '{}',
  pluline       boolean not null default false,
  wkz           boolean not null default false,
  veranstaltung text not null default '',
  sub_event     text not null default '',
  verantwortung text not null default '',
  owners        text[] not null default '{}',
  status        status not null default 'geplant',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id)
);

-- Veranstaltungen (je Land + Kategorie eindeutig; Orte/Termine in subs)
create table veranstaltung (
  id          uuid primary key default gen_random_uuid(),
  land        text not null,
  kategorie   text not null,
  typ         text not null default '',
  subs        jsonb not null default '[]',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id),
  unique (land, kategorie)
);

-- Epics (optionaler Gesamtzeitraum je Kampagnenname)
create table epic (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, start date, ende date
);

-- Individuelle Tabellenansicht je Nutzer (Spaltenreihenfolge/-breiten …)
create table user_pref (
  user_id uuid not null references auth.users (id) on delete cascade,
  schluessel text not null, wert jsonb not null,
  primary key (user_id, schluessel)
);

-- =========================================================================
-- 2) Rollen-Helfer & Row Level Security (Migration 02 / 06)
-- =========================================================================
create function aktuelle_rolle() returns rolle
language sql stable security definer set search_path = public as $$
  select rolle from public.profile where id = auth.uid() and aktiv $$;

create function ist_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rolle = 'admin' from public.profile
                   where id = auth.uid() and aktiv), false) $$;

-- Lesen: jeder aktive Nutzer. Schreiben/Ändern/Löschen: editor + admin.
-- profile: nur Admin darf Rolle/Freischaltung ändern.
-- user_pref: nur eigene Zeilen. (Policies siehe Migration 02.)
-- audit_log/snapshot: nur Admin lesen.

-- =========================================================================
-- 3) Bearbeitungs-Sperren + Realtime (Migration 03)
-- =========================================================================
create table bearbeitung_lock (
  entity_type text not null, entity_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null default '',
  locked_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);
-- Sperren älter als 5 Minuten gelten als abgelaufen und dürfen übernommen
-- werden. Realtime ist für kampagne, veranstaltung, epic und
-- bearbeitung_lock aktiviert (Live-Updates für alle).

-- =========================================================================
-- 4) Änderungs-Historie (User-Logs) + Undo (Migration 04)
-- =========================================================================
create table audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  user_id uuid, user_email text,
  tabelle text not null, datensatz_id text,
  aktion text not null,            -- insert | update | delete
  alt jsonb, neu jsonb,
  rueckgaengig_am timestamptz
);
-- Trigger audit_trigger() protokolliert jede Mutation auf kampagne,
-- veranstaltung, epic. aenderung_rueckgaengig(log_id) stellt (nur Admin) den
-- Vorzustand eines Log-Eintrags wieder her.

-- =========================================================================
-- 5) Tägliches Backup, 7 Tage (Migration 05)
-- =========================================================================
create table snapshot (
  id bigint generated always as identity primary key,
  datum date not null unique,
  erstellt_at timestamptz not null default now(),
  inhalt jsonb not null
);
-- snapshot_erstellen() / snapshot_aufraeumen() (>7 Tage löschen) laufen
-- täglich per pg_cron-Job 'taeglicher-snapshot' (02:17 UTC).
-- snapshot_liste() (Metadaten) und snapshot_wiederherstellen(datum)
-- sind Admin-RPCs; vor jeder Wiederherstellung wird automatisch gesichert.
