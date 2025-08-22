-- Migration: Add Missing Columns for localStorage Compatibility
-- Description: Add missing columns that the frontend code expects
-- Date: 2025-01-25

-- Add missing columns to work_orders table if they don't exist
DO $$ 
BEGIN
    -- Add orderNumber column (localStorage format)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'orderNumber') THEN
        ALTER TABLE work_orders ADD COLUMN orderNumber VARCHAR(100);
    END IF;
    
    -- Add clientId column (localStorage format)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'clientId') THEN
        ALTER TABLE work_orders ADD COLUMN clientId UUID;
    END IF;
    
    -- Add dueDate column (localStorage format)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'dueDate') THEN
        ALTER TABLE work_orders ADD COLUMN dueDate TIMESTAMPTZ;
    END IF;
    
    -- Add createdAt column (localStorage format)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'createdAt') THEN
        ALTER TABLE work_orders ADD COLUMN createdAt TIMESTAMPTZ;
    END IF;
    
    -- Add updatedAt column (localStorage format)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'updatedAt') THEN
        ALTER TABLE work_orders ADD COLUMN updatedAt TIMESTAMPTZ;
    END IF;
    
    -- Add completedAt column (localStorage format)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'completedAt') THEN
        ALTER TABLE work_orders ADD COLUMN completedAt TIMESTAMPTZ;
    END IF;
END $$;

-- Update existing records to sync localStorage format columns with standard format
-- Only update if the source columns exist
DO $$
BEGIN
    -- Update orderNumber from order_number if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'order_number') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'orderNumber') THEN
        UPDATE work_orders SET orderNumber = order_number WHERE orderNumber IS NULL;
    END IF;
    
    -- Update clientId from client_id if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'client_id') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'clientId') THEN
        UPDATE work_orders SET clientId = client_id WHERE clientId IS NULL;
    END IF;
    
    -- Update dueDate from due_date if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'due_date') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'dueDate') THEN
        UPDATE work_orders SET dueDate = due_date WHERE dueDate IS NULL;
    END IF;
    
    -- Update createdAt from created_at if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'created_at') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'createdAt') THEN
        UPDATE work_orders SET createdAt = created_at WHERE createdAt IS NULL;
    END IF;
    
    -- Update updatedAt from updated_at if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'updated_at') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'updatedAt') THEN
        UPDATE work_orders SET updatedAt = updated_at WHERE updatedAt IS NULL;
    END IF;
    
    -- Update completedAt from completed_at if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'completed_at') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'completedAt') THEN
        UPDATE work_orders SET completedAt = completed_at WHERE completedAt IS NULL;
    END IF;
END $$;
