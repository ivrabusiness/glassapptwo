-- Migration: Add Device Management Tables
-- Description: Creates tables for device registration and management
-- Date: 2025-01-25

-- Create devices table for registered devices
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name VARCHAR(255) NOT NULL,
    device_code VARCHAR(50) UNIQUE NOT NULL, -- Unique code for device identification
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Hashed password for device login
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create device_sessions table for managing device sessions
CREATE TABLE IF NOT EXISTS device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create device_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS device_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL, -- e.g., 'process_management', 'view_orders', 'complete_processes'
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_id, permission)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_email ON devices(email);
CREATE INDEX IF NOT EXISTS idx_devices_device_code ON devices(device_code);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_token ON device_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_device_sessions_expires ON device_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_permissions_device_id ON device_permissions(device_id);

-- Add Row Level Security (RLS)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for devices table
CREATE POLICY "Users can view their own devices" ON devices
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own devices" ON devices
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own devices" ON devices
    FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own devices" ON devices
    FOR DELETE USING (tenant_id = auth.uid());

-- RLS Policies for device_sessions table
CREATE POLICY "Devices can view their own sessions" ON device_sessions
    FOR SELECT USING (
        device_id IN (
            SELECT id FROM devices WHERE tenant_id = auth.uid()
        )
    );

CREATE POLICY "Devices can insert their own sessions" ON device_sessions
    FOR INSERT WITH CHECK (
        device_id IN (
            SELECT id FROM devices WHERE tenant_id = auth.uid()
        )
    );

CREATE POLICY "Devices can update their own sessions" ON device_sessions
    FOR UPDATE USING (
        device_id IN (
            SELECT id FROM devices WHERE tenant_id = auth.uid()
        )
    );

CREATE POLICY "Devices can delete their own sessions" ON device_sessions
    FOR DELETE USING (
        device_id IN (
            SELECT id FROM devices WHERE tenant_id = auth.uid()
        )
    );

-- RLS Policies for device_permissions table
CREATE POLICY "Users can view permissions for their devices" ON device_permissions
    FOR SELECT USING (
        device_id IN (
            SELECT id FROM devices WHERE tenant_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage permissions for their devices" ON device_permissions
    FOR ALL USING (
        device_id IN (
            SELECT id FROM devices WHERE tenant_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for devices table
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions for process management
INSERT INTO device_permissions (device_id, permission) 
SELECT id, 'process_management' FROM devices 
ON CONFLICT (device_id, permission) DO NOTHING;

INSERT INTO device_permissions (device_id, permission) 
SELECT id, 'view_orders' FROM devices 
ON CONFLICT (device_id, permission) DO NOTHING;

INSERT INTO device_permissions (device_id, permission) 
SELECT id, 'complete_processes' FROM devices 
ON CONFLICT (device_id, permission) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE devices IS 'Registered devices that can access process management functionality';
COMMENT ON COLUMN devices.device_name IS 'Human-readable name for the device';
COMMENT ON COLUMN devices.device_code IS 'Unique code for device identification and login';
COMMENT ON COLUMN devices.tenant_id IS 'Reference to the user who owns this device';
COMMENT ON COLUMN devices.email IS 'Email address for device login';
COMMENT ON COLUMN devices.password_hash IS 'Hashed password for device authentication';
COMMENT ON COLUMN devices.status IS 'Current status of the device (active, inactive, suspended)';

COMMENT ON TABLE device_sessions IS 'Active sessions for device authentication';
COMMENT ON COLUMN device_sessions.session_token IS 'Unique token for session identification';
COMMENT ON COLUMN device_sessions.expires_at IS 'When the session expires';

COMMENT ON TABLE device_permissions IS 'Granular permissions for devices';
COMMENT ON COLUMN device_permissions.permission IS 'Specific permission granted to the device';
