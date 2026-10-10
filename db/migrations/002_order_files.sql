-- The customer's photos and voice note for an order (and, later, Mimi's progress photos). The file
-- itself lives in Netlify Blobs under `key`; this row says what it is and who it belongs to.

create table order_files (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references orders (id) on delete cascade,
  kind          text not null check (kind in ('photo', 'voice', 'progress')),
  -- Photos keep the customer's order (0 is the main one). One voice note, at 0.
  position      smallint not null check (position between 0 and 19),
  key           text not null unique,
  content_type  text not null,
  bytes         integer not null check (bytes > 0),
  width         integer,
  height        integer,
  created_at    timestamptz not null default now(),
  -- A retried upload can't add the same photo twice.
  unique (order_id, kind, position)
);
