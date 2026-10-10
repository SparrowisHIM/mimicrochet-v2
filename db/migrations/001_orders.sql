-- Orders and their updates. Everything the customer filled in that the site only shows (the piece,
-- size, fit, colours, notes) lives in `details`; the columns are what gets searched, sorted or changed.

create sequence if not exists order_number_seq start 2412;

create table orders (
  id            bigint generated always as identity primary key,
  -- What the customer and Mimi say out loud: MIMI-2412. Sequential, so it never opens an order alone.
  number        text not null unique default ('MIMI-' || nextval('order_number_seq')),
  -- The private key to the tracking page (8 random characters, made on the server).
  code          text not null unique check (code ~ '^[a-hj-km-np-z2-9]{8}$'),
  kind          text not null check (kind in ('custom', 'shop')),
  stage         smallint not null default 0 check (stage between 0 and 4),
  -- Custom requests: false until the customer taps Send on WhatsApp.
  sent          boolean not null default false,
  details       jsonb not null,
  name          text not null check (char_length(name) between 2 and 60),
  phone         text not null,
  phone_last4   char(4) not null,
  email         text,
  state         text not null,
  area          text not null,
  -- Shop orders' street address: shown to Mimi only, never on a tracking page.
  address       text,
  price         integer check (price > 0),
  ready_by      text,
  deposit_paid  boolean not null default false,
  paid_in_full  boolean not null default false,
  payment_sent  text check (payment_sent in ('deposit', 'full')),
  delivered_at  timestamptz,
  -- Customer photos and voice notes are deleted 2 months after delivery; this records when.
  files_deleted_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index orders_lookup on orders (number, phone_last4);
create index orders_open on orders (stage, created_at desc);

create table order_updates (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references orders (id) on delete cascade,
  stage       smallint not null check (stage between 0 and 4),
  note        text not null check (char_length(note) <= 500),
  -- A progress photo from Mimi (a storage key, added with uploads).
  photo       text,
  created_at  timestamptz not null default now()
);

create index order_updates_by_order on order_updates (order_id, created_at);
