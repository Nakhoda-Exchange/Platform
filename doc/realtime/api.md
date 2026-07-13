# Realtime — WebSocket contract

Source port: `lib/core/application/realtime/ports/realtime-source.port.ts` ·
Adapters: `lib/infrastructure/realtime/{ws,mock}-realtime.source.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

The platform opens **one** WebSocket for live data. It connects to
`NEXT_PUBLIC_WS_URL` (e.g. `ws://localhost:4000/ws`) when set; otherwise an
in-browser simulator serves the same frames, so the app streams live-looking
data with no backend (the realtime twin of the mock repositories). The backend
endpoint is Substructure's `GET /ws` (`src/modules/realtime`).

Money is integer **Toman**; every time is **epoch ms**; payloads use Latin
digits (the UI renders Persian).

## Channels

| Channel  | Frames         | Description                                     |
| -------- | -------------- | ----------------------------------------------- |
| `prices` | `price`        | Live price tick per coin                        |
| `trades` | `trade.update` | Order lifecycle: new, status change, and expiry |

## Client → server

```jsonc
{ "type": "subscribe", "channels": ["prices", "trades"] }   // pick channels
{ "type": "unsubscribe", "channels": ["trades"] }           // drop channels
{ "type": "ping" }                                          // keepalive → pong
```

Frames that don't match get an `error` control frame; the connection stays open.

## Server → client

**Control frames** (connection, not channel data):

```jsonc
{ "type": "welcome", "channels": ["prices", "trades"], "at": 1783250000000 }
{ "type": "subscribed", "channels": ["prices"] }
{ "type": "pong", "at": 1783250000000 }
{ "type": "error", "code": "BAD_MESSAGE", "message": "expected JSON" }
```

On connect the server sends `welcome` followed by a **price snapshot** (one
`price` per coin) so the UI paints immediately, then streams updates.

**`price`** (channel `prices`):

```jsonc
{
  "type": "price",
  "coinId": "btc",
  "symbol": "BTC",
  "priceIrt": 3900120000,
  "priceUsd": 65802.4,
  "change24h": 0.31, // signed percent vs the ~24h reference
  "at": 1783250000000,
}
```

**`trade.update`** (channel `trades`):

```jsonc
{
  "type": "trade.update",
  "tradeId": "sim-42",
  "coinId": "btc",
  "symbol": "BTC",
  "side": "buy", // buy | sell
  "status": "open", // pending | open | done | expired | failed
  "amountCoin": 0.125,
  "priceIrt": 3900000000,
  "totalIrt": 487500000,
  "expiresAt": 1783250030000, // present only while pending | open
  "at": 1783250000000,
}
```

`status` transitions: `pending → open → done`, or `→ expired` once `expiresAt`
passes, or `→ failed`. The platform surfaces the terminal states (done /
expired / failed) as toasts; `pending`/`open` churn is consumed silently.

## Consuming it

```ts
// live prices, keyed by coin id, plus connection status
const { prices, status } = useLivePrices();

// react to trade lifecycle events (drives the toaster)
useTradeUpdates((update) => {
  /* … */
});
```

Both hooks live in `lib/realtime/use-realtime.ts`; they open the shared
connection on mount and release it on unmount.
