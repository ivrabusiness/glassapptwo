-- Migration: Add 'return' type to stock_transactions
-- Description: Allows 'return' transaction type for material returns from deleted work orders
-- Date: 2025-08-02

-- Drop the existing check constraint
ALTER TABLE stock_transactions 
DROP CONSTRAINT IF EXISTS stock_transactions_type_check;

-- Add the new check constraint with 'return' type included
ALTER TABLE stock_transactions 
ADD CONSTRAINT stock_transactions_type_check 
CHECK (type IN ('in', 'out', 'adjustment', 'return'));

-- Add comment explaining the new type
COMMENT ON COLUMN stock_transactions.type IS 'Transaction type: in=incoming stock, out=outgoing stock, adjustment=stock correction, return=material return from deleted work order';
