-- Migration: Add Device RLS Policies
-- Description: Add RLS policies to allow device users access to tenant data
-- Date: 2025-01-25

-- Function to check if current user is a device belonging to a tenant
CREATE OR REPLACE FUNCTION is_device_of_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is a device user with the specified tenant_id in metadata
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'user_type') = 'device'
    AND (raw_user_meta_data->>'tenant_id')::UUID = tenant_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for main tables to allow device access

-- Work Orders - allow devices to read and update work orders of their tenant
DROP POLICY IF EXISTS "Devices can access tenant work orders" ON work_orders;
CREATE POLICY "Devices can access tenant work orders" ON work_orders
    FOR ALL USING (
        tenant_id = auth.uid() OR is_device_of_tenant(tenant_id)
    );

-- Processes - allow devices to read processes of their tenant  
DROP POLICY IF EXISTS "Devices can read tenant processes" ON processes;
CREATE POLICY "Devices can read tenant processes" ON processes
    FOR SELECT USING (
        tenant_id = auth.uid() OR is_device_of_tenant(tenant_id)
    );

-- Products - allow devices to read products of their tenant
DROP POLICY IF EXISTS "Devices can read tenant products" ON products;
CREATE POLICY "Devices can read tenant products" ON products
    FOR SELECT USING (
        tenant_id = auth.uid() OR is_device_of_tenant(tenant_id)
    );

-- Inventory - allow devices to read inventory of their tenant
DROP POLICY IF EXISTS "Devices can read tenant inventory" ON inventory;
CREATE POLICY "Devices can read tenant inventory" ON inventory
    FOR SELECT USING (
        tenant_id = auth.uid() OR is_device_of_tenant(tenant_id)
    );

-- Clients - allow devices to read clients of their tenant
DROP POLICY IF EXISTS "Devices can read tenant clients" ON clients;
CREATE POLICY "Devices can read tenant clients" ON clients
    FOR SELECT USING (
        tenant_id = auth.uid() OR is_device_of_tenant(tenant_id)
    );

-- Device Info - allow devices to read their own info
DROP POLICY IF EXISTS "Devices can read their own info" ON device_info;
CREATE POLICY "Devices can read their own info" ON device_info
    FOR SELECT USING (
        tenant_id = auth.uid() OR auth_user_id = auth.uid()
    );
