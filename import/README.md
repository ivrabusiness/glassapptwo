# Import Folder - JSON Strukture

Ovaj folder sadrži pojedinačne JSON datoteke za uvoz podataka u Glass aplikaciju.

## 📁 Dostupne datoteke

### 🏭 **suppliers.json**
Dobavljači - array objekata s ovim poljima:
```json
[
  {
    "id": "uuid",
    "name": "string (obavezno)",
    "type": "company|individual (default: company)",
    "address": "string (obavezno)",
    "oib": "string (obavezno, jedinstveno)",
    "phone": "string (opcionalno)",
    "email": "string (opcionalno)",
    "notes": "string (opcionalno)",
    "contactPerson": "string (opcionalno)",
    "tenantId": "uuid (obavezno)",
    "createdAt": "ISO timestamp"
  }
]
```

### ⚙️ **processes.json**
Procesi obrade - array objekata s ovim poljima:
```json
[
  {
    "id": "uuid",
    "name": "string (obavezno)",
    "description": "string (opcionalno)",
    "order": "number (redoslijed)",
    "price": "number (osnovna cijena)",
    "estimatedDuration": "number (minute)",
    "tenantId": "uuid (obavezno)",
    "createdAt": "ISO timestamp",
    "priceType": "square_meter|linear_meter|piece",
    "thicknessPrices": [
      {
        "price": "number",
        "thickness": "number (mm)"
      }
    ]
  }
]
```

### 👥 **clients.json**
Klijenti - array objekata s ovim poljima:
```json
[
  {
    "id": "uuid",
    "name": "string (obavezno)",
    "type": "company|individual",
    "address": "string (obavezno)",
    "phone": "string (opcionalno)",
    "email": "string (opcionalno)",
    "oib": "string (obavezno)",
    "notes": "string (opcionalno)",
    "contactPerson": "string (opcionalno)",
    "tenantId": "uuid (obavezno)",
    "createdAt": "ISO timestamp"
  }
]
```

### 📦 **inventory.json**
Skladišni artikli - array objekata s ovim poljima:
```json
[
  {
    "id": "uuid",
    "name": "string (obavezno)",
    "code": "string (obavezno, jedinstveno)",
    "unit": "string (m², m, kom, kg...)",
    "quantity": "number (trenutna količina)",
    "price": "number (nabavna cijena)",
    "type": "glass|material|tool",
    "notes": "string (opcionalno)",
    "minQuantity": "number (minimalna zaliha)",
    "glassThickness": "number|null (debljina u mm za staklo)",
    "tenantId": "uuid (obavezno)",
    "createdAt": "ISO timestamp"
  }
]
```

## 🎯 Kako koristiti

1. **Pojedinačni uvoz**: Uvezi bilo koju datoteku iz ovog foldera u Settings stranici
2. **Automatska detekcija**: Aplikacija će prepoznati tip datoteke po imenu
3. **Validacija**: Svi UUID-jevi moraju biti valjani
4. **Tenant izolacija**: Svi zapisi moraju imati isti tenantId

## 📋 Tipovi cijena za procese

- **square_meter**: Cijena po m²
- **linear_meter**: Cijena po metru (za brušenje rubova)
- **piece**: Cijena po komadu (za bušenje rupa)

## 🔧 Thickness Prices

Za procese koji ovise o debljini stakla (kaljenje, laminiranje):
- Ako je `thicknessPrices` prazan array → koristi osnovnu `price`
- Ako ima vrijednosti → koristi cijenu za specifičnu debljinu

## ⚠️ Važne napomene

- Svi ID-jevi moraju biti valjani UUID format
- OIB mora biti jedinstven po tenant-u
- Obavezna polja ne smiju biti prazna
- Datumi moraju biti u ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)

## 🚀 Primjer korištenja

```bash
# Uvezi dobavljače
Settings → Uvezi podatke → suppliers.json

# Uvezi procese
Settings → Uvezi podatke → processes.json

# Uvezi klijente  
Settings → Uvezi podatke → clients.json
```

Svaki uvoz će prikazati notifikaciju s brojem uvezenih stavki.
