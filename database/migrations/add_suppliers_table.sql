-- Add suppliers table migration
-- This migration creates the suppliers table with proper constraints and indexes

create table public.suppliers (
  id uuid not null default gen_random_uuid (),
  name text not null,
  type text not null default 'company'::text,
  address text not null,
  oib text not null,
  contact_person text null,
  phone text null,
  email text null,
  notes text null,
  tenant_id uuid not null default auth.uid (),
  created_at timestamp with time zone null default now(),
  constraint suppliers_pkey primary key (id),
  constraint suppliers_oib_tenant_id_key unique (oib, tenant_id),
  constraint suppliers_type_check check (
    (
      type = any (array['company'::text, 'individual'::text])
    )
  )
) TABLESPACE pg_default;

-- Create indexes for performance
create index IF not exists idx_suppliers_tenant_id on public.suppliers using btree (tenant_id) TABLESPACE pg_default;

create index IF not exists idx_suppliers_oib on public.suppliers using btree (oib) TABLESPACE pg_default;

-- Enable Row Level Security
alter table public.suppliers enable row level security;

-- Create RLS policies
create policy "Users can view their own suppliers" on public.suppliers
  for select using (auth.uid() = tenant_id);

create policy "Users can insert their own suppliers" on public.suppliers
  for insert with check (auth.uid() = tenant_id);

create policy "Users can update their own suppliers" on public.suppliers
  for update using (auth.uid() = tenant_id);

create policy "Users can delete their own suppliers" on public.suppliers
  for delete using (auth.uid() = tenant_id);

-- Add comment
comment on table public.suppliers is 'Suppliers/vendors table with tenant isolation';
