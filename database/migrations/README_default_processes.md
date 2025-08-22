# Default Process Management - Product Level Implementation

## Pregled

Implementiran je sustav za označavanje default procesa na **product level** - kada se definiraju procesi za proizvod, tada se označava koji su default. Ovaj pristup omogućava da različiti proizvodi imaju različite default procese.

## Implementacija

### 1. Dodano `isDefault` polje u `ProcessStep` interface

```typescript
export interface ProcessStep {
  id: string;
  processId: string;
  status: 'pending' | 'in-progress' | 'completed';
  // ... ostala polja
  isDefault?: boolean; // Označava da li je ovaj proces default za ovaj proizvod
}
```

### 2. Ažurirana logika u ponudama

U `useQuoteBusinessLogic` hook-u, logika za kopiranje procesa iz proizvoda sada filtrira samo default procese označene na proizvodu:

```typescript
// SADA - kopira samo default procese označene na proizvodu
processSteps: material.processSteps
  .filter(step => {
    // Filtriraj samo default procese označene na proizvodu
    return step.isDefault === true;
  })
  .map(step => ({ ... }))
```

### 3. Ažurirana logika u radnim nalozima

Logika u `ItemEditor` komponenti koristi `processStep.isDefault` flag:

```typescript
// Add default processes for this material
productMaterial.processSteps.forEach(processStep => {
  if (processStep.isDefault) {
    // Dodaj proces automatski
  }
});
```

### 4. UI za upravljanje default procesima u Products.tsx

Dodana je funkcionalnost u product management gdje korisnik može:
- Odabrati procese za svaki materijal proizvoda
- Označiti koji od odabranih procesa su **default**
- Vidjeti vizualnu potvrdu da će se default procesi automatski dodati

```typescript
const toggleProcessDefault = (materialIndex: number, processId: string) => {
  // Označava/odznačava proces kao default za taj proizvod
};
```

## Kako koristiti

### Korak 1: Definiraj procese za proizvod

1. Idi u **Products** → odaberi proizvod → **Edit**
2. Dodaj materijale za proizvod
3. Označiti "Materijal ima procese proizvodnje"
4. Odaberi procese koji se koriste za taj materijal
5. **Označiti "Default"** za procese koji se trebaju automatski dodati

### Korak 2: Testiranje

1. **Ponude**: Odaberi proizvod → trebaju se kopirati samo default procesi
2. **Radni nalozi**: Odaberi proizvod → trebaju se automatski označiti samo default procesi
3. **Provjeri konzolu**: Debug logovi pokazuju koje procese sustav koristi

## Prednosti

✅ **Konzistentnost** - Isti izvor istine za sve korisnike i uređaje  
✅ **Centralizirano upravljanje** - Default procesi se upravljaju u bazi  
✅ **Multi-tenant podrška** - Svaki tenant ima svoje default procese  
✅ **Real-time sync** - Promjene se odmah reflektiraju svugdje  
✅ **Skalabilnost** - Nema ovisnosti o localStorage-u  

## Debug

Za praćenje rada sustava, provjeri konzolu za logove:

```
🔄 Processes loaded from database: 9
✅ Process abc123 default status updated to: true
🔍 QUOTE: Filtering default processes for product selection
```

## Sljedeći koraci

1. **UI za upravljanje** - Dodati sučelje za označavanje default procesa
2. **Bulk operacije** - Mogućnost označavanja više procesa odjednom
3. **Audit trail** - Praćenje promjena default status-a
4. **Backup strategija** - Sigurnosne kopije default konfiguracije
