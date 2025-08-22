-- Migration: Add Device Info Table (Simplified)
-- Description: Creates a simple table to track device info without auth complexity
-- Date: 2025-01-25

-- Create device_info table to track devices registered by tenants
CREATE TABLE IF NOT EXISTS device_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name VARCHAR(255) NOT NULL,
    device_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_user_id UUID, -- Reference to auth.users for the device
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_info_tenant_id ON device_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_info_device_code ON device_info(device_code);
CREATE INDEX IF NOT EXISTS idx_device_info_status ON device_info(status);
CREATE INDEX IF NOT EXISTS idx_device_info_auth_user_id ON device_info(auth_user_id);

-- Add Row Level Security (RLS)
ALTER TABLE device_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_info table
CREATE POLICY "Users can view their own devices" ON device_info
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own devices" ON device_info
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own devices" ON device_info
    FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own devices" ON device_info
    FOR DELETE USING (tenant_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for device_info table
CREATE TRIGGER update_device_info_updated_at 
    BEFORE UPDATE ON device_info 
    FOR EACH ROW 
    EXECUTE FUNCTION update_device_info_updated_at();

-- Comments for documentation
COMMENT ON TABLE device_info IS 'Information about registered devices for each tenant';
COMMENT ON COLUMN device_info.device_name IS 'Human-readable name for the device';
COMMENT ON COLUMN device_info.device_code IS 'Unique code for device identification';
COMMENT ON COLUMN device_info.tenant_id IS 'Reference to the user who owns this device';
COMMENT ON COLUMN device_info.auth_user_id IS 'Reference to auth.users for the device user';
COMMENT ON COLUMN device_info.status IS 'Current status of the device (active, inactive, suspended)';
