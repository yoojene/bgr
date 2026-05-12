create table if not exists crew_notes (
  id text primary key,
  checkpoint_name text not null,
  author_name text not null,
  crew_note text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists crew_notes_checkpoint_name_idx
  on crew_notes (checkpoint_name, updated_at desc);