---
description: Refactoriranje featura
auto_execution_mode: 1
---

Workflow: Refaktoriraj Quotes (WINDsurf)

Trigger (Command): /refactor-quotes
Scope: Workspace (preporuka)
Opis: Analizira postojeći “quotes” kod, izradi plan, razbije ga na slojeve i datoteke, te predloži konkretne promjene fajlova i patch diffe.

Prompt (zalijepi u Workflow editor):

CILJ
Refaktoriraj quotes domenu na WINDsurf standard:

max 350 linija po datoteci, bez dupliciranja, TypeScript svugdje

feature-first struktura: src/features/quotes/{api,services,hooks,components,store,types,constants,mappers}

DTO↔Domain odvojeno (*.dto.ts, *.model.ts, *.mapper.ts, *.validation.ts s zod)

TanStack Query za server-state (query keys, select, staleTime), bez fetchanja u komponentama

Zustand samo za cross-component UI state (ako uopće treba)

Barrel export samo u features/quotes/index.ts

Komponente male i memo, teška logika u hookove; liste virtualizirati kad ima puno redaka

Code-splitting po rutama/feature-ima; skupi poslovi u web worker

ULAZ
Postojeći projekt (vite/react/ts). Postojeće lokacije koje mogu sadržavati quotes-kod:

src/components/quotes/{Create,Edit,list,print,view}

src/services/PDFService.ts, src/services/Print/* (ako se koristi za quotes export)

src/hooks/useSupabaseData.ts, src/hooks/*

src/lib/supabase.ts, src/lib/issueWorkOrder.ts (provjeri ovisnosti)

src/types.ts, src/types/index.ts, src/utils/validation.ts, src/utils/pdf/templates/*

IZLAZ (format koji očekujem)

ANALIZA (sažetak): gdje je quotes logika sada; koji fajlovi prelaze 350 linija; duplikati.

PLAN MAPIRANJA (tablica “od → do”): točno navedi nove putanje i nazive fajlova.

SKELETON: prikaži strukturu koju ćeš kreirati pod src/features/quotes/ (mape + prazne fajlove).

QUERY KEYS: sadržaj query-keys.ts.

API MODULI (po resursu): api/quotes.api.ts, api/quote-items.api.ts, api/payments.api.ts (ako postoje), svaki ≤200 linija.

TYPES: types/quote.dto.ts, types/quote.model.ts, types/quote.validation.ts (zod).

MAPPERS: mappers/quote.mapper.ts (DTO↔Model).

HOOKS: hooks/use-quotes.ts (useQuery + useMutations, select, staleTime) — bez fetch u komponentama.

SERVISI: kratki orkestrator services/quotes.service.ts + (ako treba) pricing.service.ts, export.pdf.service.ts / export.excel.service.ts.

KOMPONENTE: prijedlog razbijanja velikih komponenti (list/QuoteList.tsx, form/QuoteForm.tsx, view/QuoteView.tsx, shared/QuoteStatus.tsx, shared/QuoteTotals.tsx) i što ide u koji.

BARREL: sadržaj features/quotes/index.ts (public API).

PATCH DIFF: predloži konkretne izmjene import putanja (diff blokovi).

CHECKLISTA (DoD): što ručno provjeriti (build, lint, tsc, testovi).

KORACI IZVOĐENJA (obavezno prati redoslijed)

K1 ANALIZA: pretraži projekt za “quotes”, “payment”, “quote” pojmove i složi popis datoteka.

K2 PLAN: za svaki fajl iz K1 odredi ciljnu lokaciju u features/quotes/* i nazive s ispravnim sufiksima.

K3 SKELETON: izgeneriraj mapu/fajl strukturu (bez sadržaja ili s minimalnim headerima).

K4 TYPES & VALIDACIJA: napiši quote.dto.ts, quote.model.ts, quote.validation.ts (zod) — kratko i točno.

K5 API: razdvoji pozive po resursima; koristi shared/api/request.ts ili shared/api/supabase.ts.

K6 MAPPERS: napiši mapQuoteDtoToModel, mapQuoteModelToDto.

K7 HOOKS: use-quotes.ts s useQuery (select, staleTime), mutationima i invalidacijom.

K8 SERVISI: quotes.service.ts kao orkestrator (validacija, delegiranje pricinga).

K9 KOMPONENTE: predloži kako podijeliti velike komponente ispod 350 linija; gdje dodati React.memo.

K10 BARREL: sastavi features/quotes/index.ts (samo public API).

K11 PATCH DIFf: za svaku staru komponentu koja je ostala, predloži diff novih import putanja.

K12 KONTROLA: izlistaj DoD checklistu (lint/tsc/test/build) i poznate edge-caseove.

DODATNA PRAVILA

Ne stvaraj “god” fajlove. Ako sekcija prelazi 200–300 linija, podijeli.

U hookovima koristi select da smanjiš re-render.

Mutacije: optimistic update + precizan invalidateQueries.

Ne izvoziti sve export * iz podmapa; samo public barrel na feature rootu.

Po mogućnosti predloži virtualizaciju lista ako je 100+ redaka.

OUTPUT STIL

Naslovi “ANALIZA / PLAN MAPIRANJA / …”

Kod u TypeScriptu, blokovi označeni putanjama.

Kratko, ali kompletno; bez generičke priče — konkretne putanje i diffe.

Mini “špranca” što će Workflow proizvesti (orijentir)

src/features/quotes/query-keys.ts

src/features/quotes/api/quotes.api.ts (+ quote-items.api.ts, payments.api.ts ako treba)

src/features/quotes/types/quote.dto.ts | quote.model.ts | quote.validation.ts

src/features/quotes/mappers/quote.mapper.ts

src/features/quotes/hooks/use-quotes.ts

src/features/quotes/services/quotes.service.ts (+ pricing.service.ts, export.pdf.service.ts po potrebi)

src/features/quotes/components/{list,form,view,shared}/...

src/features/quotes/index.ts

I PLAN MAPIRANJA starih → novih putanja (primjer):

src/components/quotes/list/QuotesList.tsx
  → src/features/quotes/components/list/QuotesList.tsx

src/components/quotes/print/QuoteTemplate.ts
  → src/features/quotes/services/export/templates/QuoteTemplate.ts

src/utils/validation.ts (quote dio)
  → src/features/quotes/types/quote.validation.ts

src/types.ts (quote dio)
  → src/features/quotes/types/{quote.dto.ts, quote.model.ts}

src/components/quotes/Create/*
  → src/features/quotes/components/form/*  (+ hooks & services pozivi)