-- Paystack. Every payment starts as a row here before the customer is sent to Paystack, and is only
-- marked paid after the server has checked it with Paystack itself (on the way back, and from the
-- signed webhook). The reference is what Paystack and this table share.

create table payments (
  id          bigint generated always as identity primary key,
  reference   text not null unique check (reference ~ '^[A-Za-z0-9.=-]{8,64}$'),
  -- deposit / full / balance pay for a custom order; shop pays for pieces from the bag.
  purpose     text not null check (purpose in ('deposit', 'full', 'balance', 'shop')),
  -- The custom order being paid for. A shop order only exists once it's paid, so its row is made then.
  order_id    bigint references orders (id) on delete cascade,
  -- The tracking code Paystack sends the customer back to (made up front for a shop order).
  order_code  text not null check (order_code ~ '^[a-hj-km-np-z2-9]{8}$'),
  amount      integer not null check (amount > 0), -- naira
  email       text not null,
  -- Shop only: the pieces (priced on the server) and the delivery details, turned into an order once paid.
  cart        jsonb,
  status      text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  channel     text,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index payments_by_order on payments (order_id);

-- The 40% balance, paid when the piece is ready (a deposit order only).
alter table orders add column balance_paid boolean not null default false;

-- One-of-one pieces: sold for good once paid, or held for 15 minutes while someone is on Paystack, so
-- two people can't buy the same piece.
create table piece_stock (
  slug        text primary key,
  sold_at     timestamptz,
  order_id    bigint references orders (id) on delete set null,
  held_until  timestamptz,
  held_by     text
);
