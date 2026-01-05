-- Measurement Vault Database Schema
-- Run this in your Supabase SQL Editor

-- Businesses table (single row per project, but structured as table for future multi-tenancy)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  sex TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  garment_type TEXT,
  sex TEXT,
  -- Standard measurement fields
  shoulder NUMERIC,
  chest NUMERIC,
  waist NUMERIC,
  sleeve NUMERIC,
  length NUMERIC,
  neck NUMERIC,
  hip NUMERIC,
  inseam NUMERIC,
  thigh NUMERIC,
  seat NUMERIC,
  -- Custom fields stored as JSONB
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_measurements_business_id ON measurements(business_id);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);

-- Enable Row Level Security (RLS) - disabled for now since we're doing single-user
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

