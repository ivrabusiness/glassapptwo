-- Dodaj completion_reason kolonu u work_orders tablicu
-- Ova kolona će čuvati razlog zašto je radni nalog završen

-- Dodaj completion_reason kolonu
ALTER TABLE work_orders 
ADD COLUMN completion_reason TEXT;

-- Dodaj komentar za dokumentaciju
COMMENT ON COLUMN work_orders.completion_reason IS 'Razlog završetka radnog naloga (npr. automatski završen generiranjem otpremnice, ručno završen, itd.)';

-- Dodaj indeks za brže pretraživanje po razlogu završetka
CREATE INDEX idx_work_orders_completion_reason ON work_orders(completion_reason) WHERE completion_reason IS NOT NULL;

-- Ažuriraj postojeće završene naloge da imaju generički razlog
UPDATE work_orders 
SET completion_reason = 'Ručno završen' 
WHERE status = 'completed' AND completion_reason IS NULL;
