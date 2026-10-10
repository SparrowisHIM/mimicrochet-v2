-- Mimi's studio: the date an order is due (for "due soon" and "late"), the phones that get a
-- notification when an order comes in, and a small log for limiting repeated attempts (sign-in tries
-- now; order lookups and uploads later).

alter table orders add column ready_on date;

create table push_subscriptions (
  id          bigint generated always as identity primary key,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  -- "iPhone" or "Android", so Mimi can tell her phones apart.
  device      text,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);

create table rate_events (
  bucket  text not null,
  at      timestamptz not null default now()
);
create index rate_events_lookup on rate_events (bucket, at);
