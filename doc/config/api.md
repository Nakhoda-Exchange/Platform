# Platform config — API contract

Port: `lib/core/application/config/ports/config-repository.port.ts` ·
Adapter: `lib/infrastructure/config/http-config.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/config/currency-units`

Public; fetched once per page load by the root layout. The UI renders these
labels verbatim on every amount — rebranding a unit is a backend change.

```json
// 200 — CurrencyUnits
{ "irt": "تومان", "usd": "دلار" }
```

(«همت» is NOT here on purpose — it is vocabulary for «هزار میلیارد تومان»,
not a currency unit.)
