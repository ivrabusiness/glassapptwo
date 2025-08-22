-- Rollback migracija - uklanja is_default kolonu iz processes tablice
-- Pokreni ovo ako si slučajno dodao is_default kolonu u processes tablicu

-- Provjeri da li kolona postoji prije brisanja
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'processes' 
        AND column_name = 'is_default'
        AND table_schema = 'public'
    ) THEN
        -- Ukloni is_default kolonu
        ALTER TABLE public.processes DROP COLUMN is_default;
        RAISE NOTICE 'Kolona is_default je uspješno uklonjena iz processes tablice';
    ELSE
        RAISE NOTICE 'Kolona is_default ne postoji u processes tablici - nema potrebe za brisanjem';
    END IF;
END $$;

-- Ukloni indekse ako postoje
DROP INDEX IF EXISTS idx_processes_is_default;
DROP INDEX IF EXISTS idx_processes_tenant_default;

-- Potvrdi da je kolona uklonjena
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'processes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
