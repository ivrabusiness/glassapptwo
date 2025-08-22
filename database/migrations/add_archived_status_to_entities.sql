-- Migration: Add 'archived' status to quotes, delivery_notes and work_orders
-- Date: 2025-08-17

-- QUOTES: allow 'archived'
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
CHECK (status = ANY(ARRAY[
  'created'::text,
  'accepted'::text,
  'rejected'::text,
  'expired'::text,
  'converted'::text,
  'archived'::text
]));

COMMENT ON CONSTRAINT quotes_status_check ON quotes IS 
'Dozvoljeni statusi ponuda: created, accepted, rejected, expired, converted, archived';

-- DELIVERY NOTES: allow 'archived'
ALTER TABLE delivery_notes DROP CONSTRAINT IF EXISTS delivery_notes_status_check;
ALTER TABLE delivery_notes ADD CONSTRAINT delivery_notes_status_check 
CHECK (status = ANY(ARRAY[
  'draft'::text,
  'generated'::text,
  'delivered'::text,
  'invoiced'::text,
  'archived'::text
]));

COMMENT ON CONSTRAINT delivery_notes_status_check ON delivery_notes IS 
'Dozvoljeni statusi otpremnica: draft, generated, delivered, invoiced, archived';

-- WORK ORDERS: allow 'archived'
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check 
CHECK (status = ANY(ARRAY[
  'draft'::text,
  'pending'::text,
  'in-progress'::text,
  'completed'::text,
  'cancelled'::text,
  'archived'::text
]));

COMMENT ON CONSTRAINT work_orders_status_check ON work_orders IS 
'Dozvoljeni statusi radnih naloga: draft, pending, in-progress, completed, cancelled, archived';
