-- Delivery. Once an order is paid, Mimi books a rider and taps "Sent to the rider" (which also opens WhatsApp so
-- she can send the customer the rider's number). Delivered then comes from the customer ("I've received it")
-- or from Mimi once they tell her, and only after it has gone to the rider.
alter table orders add column sent_to_rider_at timestamptz;
