-- Migration: Add purchase_order to quotes and work_orders
-- Description: Adds optional purchase_order (customer PO) to quotes and work_orders
-- Date: 2025-08-21

-- Quotes: add purchase_order if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'purchase_order'
  ) THEN
    ALTER TABLE quotes ADD COLUMN purchase_order TEXT;
  END IF;
END $$;

-- Work Orders: add purchase_order if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders' AND column_name = 'purchase_order'
  ) THEN
    ALTER TABLE work_orders ADD COLUMN purchase_order TEXT;
  END IF;
END $$;

-- No indexes needed; simple text lookup is sufficient for now.
