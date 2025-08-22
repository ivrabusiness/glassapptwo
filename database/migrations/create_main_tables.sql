-- Migration: Create Main Tables
-- Description: Create main tables for work orders, processes, products, inventory, clients
-- Date: 2025-01-25

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create processes table
CREATE TABLE IF NOT EXISTS processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_time INTEGER, -- in minutes
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL,
    orderNumber VARCHAR(100), -- localStorage format compatibility
    client_id UUID REFERENCES clients(id),
    clientId UUID, -- localStorage format compatibility
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    dueDate TIMESTAMPTZ, -- localStorage format compatibility
    items JSONB, -- Store complex order structure as JSON
    notes TEXT,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ, -- localStorage format compatibility
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ, -- localStorage format compatibility
    completed_at TIMESTAMPTZ,
    completedAt TIMESTAMPTZ -- localStorage format compatibility
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processes_tenant_id ON processes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_order_number ON work_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (will be extended by device policies)
CREATE POLICY "Users can manage their own clients" ON clients
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own products" ON products
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own inventory" ON inventory
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own processes" ON processes
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own work orders" ON work_orders
    FOR ALL USING (tenant_id = auth.uid());
