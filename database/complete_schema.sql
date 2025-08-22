-- Complete Glass Factory Database Schema
-- Generated for development environment setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create main tables
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('glass', 'other')),
    unit TEXT NOT NULL DEFAULT 'm²',
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    glass_thickness INTEGER,
    notes TEXT DEFAULT '',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, tenant_id),
    UNIQUE(name, tenant_id)
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT DEFAULT '',
    materials JSONB NOT NULL DEFAULT '[]',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, tenant_id),
    UNIQUE(name, tenant_id)
);

CREATE TABLE IF NOT EXISTS processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_type TEXT NOT NULL DEFAULT 'square_meter' CHECK (price_type IN ('square_meter', 'fixed', 'per_item')),
    thickness_prices JSONB DEFAULT '[]',
    estimated_duration INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'company' CHECK (type IN ('company', 'individual')),
    address TEXT DEFAULT '',
    oib TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'company' CHECK (type IN ('company', 'individual')),
    address TEXT DEFAULT '',
    oib TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'created', 'converted', 'archived')),
    notes TEXT DEFAULT '',
    purchase_order TEXT,
    valid_until DATE,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    converted_to_work_order_id UUID,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    product_amount DECIMAL(10,2),
    process_amount DECIMAL(10,2),
    vat_rate DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    payment_info JSONB DEFAULT '{}',
    payment_date DATE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quote_number, tenant_id)
);

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'in-progress', 'completed', 'cancelled', 'archived')),
    notes TEXT DEFAULT '',
    purchase_order TEXT,
    original_quote_total DECIMAL(10,2),
    current_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_change_reason TEXT,
    price_change_approved_by TEXT,
    price_change_approved_at TIMESTAMPTZ,
    requires_quote_update BOOLEAN DEFAULT false,
    completion_reason TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_number, tenant_id)
);

CREATE TABLE IF NOT EXISTS delivery_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_number TEXT NOT NULL,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'delivered', 'invoiced', 'archived')),
    notes TEXT DEFAULT '',
    delivered_at TIMESTAMPTZ,
    delivered_by TEXT,
    received_by TEXT,
    invoiced_at TIMESTAMPTZ,
    invoice_number TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(delivery_number, tenant_id)
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'return')),
    quantity DECIMAL(10,2) NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL,
    new_quantity DECIMAL(10,2) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    document_number TEXT,
    document_type TEXT DEFAULT 'invoice' CHECK (document_type IN ('invoice', 'receipt', 'delivery_note', 'other')),
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    notes TEXT DEFAULT '',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    swift TEXT,
    model TEXT,
    reference_prefix TEXT,
    purpose_code TEXT,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    notes TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_visible_on_quotes BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    unit TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'check', 'other')),
    reference_number TEXT,
    notes TEXT DEFAULT '',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'tablet',
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints after all tables are created
DO $$
BEGIN
    -- Add foreign key constraint for quotes.converted_to_work_order_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'quotes_converted_to_work_order_id_fkey' 
                   AND table_name = 'quotes') THEN
        ALTER TABLE quotes ADD CONSTRAINT quotes_converted_to_work_order_id_fkey 
            FOREIGN KEY (converted_to_work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory(code);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

CREATE INDEX IF NOT EXISTS idx_processes_tenant_id ON processes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processes_order ON processes("order");

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_converted_to_work_order_id ON quotes(converted_to_work_order_id);

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

CREATE INDEX IF NOT EXISTS idx_delivery_notes_tenant_id ON delivery_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_work_order_id ON delivery_notes(work_order_id);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_tenant_id ON stock_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_inventory_item_id ON stock_transactions(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant_id ON bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_tenant_id ON payment_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_info_tenant_id ON device_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);

-- Enable Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with conditional logic to avoid duplicates
DO $$ 
BEGIN
    -- Policy for inventory
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON inventory FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON products FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for processes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'processes' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON processes FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for clients
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON clients FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for quotes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON quotes FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for work_orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_orders' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON work_orders FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for delivery_notes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_notes' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON delivery_notes FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for stock_transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_transactions' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON stock_transactions FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for bank_accounts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON bank_accounts FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for services
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON services FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for device_info
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_info' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON device_info FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for payment_records
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_records' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON payment_records FOR ALL USING (auth.uid() = tenant_id);
    END IF;
    
    -- Policy for suppliers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can only access their own tenant data') THEN
        CREATE POLICY "Users can only access their own tenant data" ON suppliers FOR ALL USING (auth.uid() = tenant_id);
    END IF;
END $$;

-- Insert default processes (optional)
INSERT INTO processes (id, name, description, "order", price, price_type, tenant_id, is_default) VALUES
('ee52c6da-f3ef-43e2-88c9-a30f367599d8', 'Rezanje', '', 1, 0, 'square_meter', '00000000-0000-0000-0000-000000000000', true),
('7259b9a0-2f87-4781-a184-c354be1bfcf4', 'Kaljenje', '', 2, 0, 'square_meter', '00000000-0000-0000-0000-000000000000', true),
('88ff6971-055b-4f13-9664-0aae58f3a51a', 'Laminiranje', '', 3, 0, 'square_meter', '00000000-0000-0000-0000-000000000000', true),
('9f9376da-6381-40b8-b741-f6895a26a6e7', 'Spajanje u izo', '', 4, 0, 'square_meter', '00000000-0000-0000-0000-000000000000', true)
ON CONFLICT (id) DO NOTHING;

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns with conditional logic
DO $$
BEGIN
    -- Trigger for quotes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quotes_updated_at') THEN
        CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for work_orders
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_orders_updated_at') THEN
        CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for device_info
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_info_updated_at') THEN
        CREATE TRIGGER update_device_info_updated_at BEFORE UPDATE ON device_info
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for inventory
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_updated_at') THEN
        CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for products
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for clients
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for suppliers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
        CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger for services
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
        CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
