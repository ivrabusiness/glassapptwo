-- Kreiranje tabele payment_records za detaljno praćenje plaćanja ponuda
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'check', 'other')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  transaction_number TEXT,
  description TEXT,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kreiranje indeksa za bolje performanse
CREATE INDEX IF NOT EXISTS idx_payment_records_quote_id ON payment_records(quote_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);

-- Dodavanje Row Level Security (RLS)
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Kreiranje RLS politika (prilagodite prema vašim potrebama)
-- Ova politika omogućuje svim autentificiranim korisnicima pristup svim zapisima
-- U produkciji možda ćete htjeti ograničiti pristup prema tenant_id ili user_id
CREATE POLICY "Enable all operations for authenticated users" ON payment_records
  FOR ALL USING (auth.role() = 'authenticated');

-- Dodavanje komentara za dokumentaciju
COMMENT ON TABLE payment_records IS 'Tabela za praćenje plaćanja ponuda - omogućuje više plaćanja po ponudi';
COMMENT ON COLUMN payment_records.quote_id IS 'Referenca na ponudu (quotes.id)';
COMMENT ON COLUMN payment_records.payment_method IS 'Način plaćanja: cash, bank_transfer, card, check, other';
COMMENT ON COLUMN payment_records.amount IS 'Iznos plaćanja u EUR';
COMMENT ON COLUMN payment_records.transaction_number IS 'Broj transakcije ili reference';
COMMENT ON COLUMN payment_records.description IS 'Opis plaćanja';
COMMENT ON COLUMN payment_records.payment_date IS 'Datum plaćanja';
COMMENT ON COLUMN payment_records.created_at IS 'Datum i vrijeme kreiranja zapisa';
