-- Popravka quotes_status_check constraint-a da dopušta samo potrebne statuse
-- Ova migracija uklanja 'draft' i 'sent' statuse, koristi samo 'created'
-- Također mijenja default status iz 'draft' u 'created'

-- Ukloni postojeći constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Ažuriraj sve 'draft' i 'sent' statuse u 'created'
UPDATE quotes SET status = 'created' WHERE status IN ('draft', 'sent');

-- Promijeni default vrijednost kolone status
ALTER TABLE quotes ALTER COLUMN status SET DEFAULT 'created';

-- Dodaj novi constraint samo s potrebnim statusima
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
CHECK (status = ANY(ARRAY['created'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'converted'::text]));

-- Dodaj komentar za dokumentaciju
COMMENT ON CONSTRAINT quotes_status_check ON quotes IS 
'Dozvoljeni statusi ponuda: created (kreirana), accepted (prihvaćena), rejected (odbijena), expired (istekla), converted (pretvorena u nalog)';
