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

> **Gap (#72): no trade-state snapshot on subscribe.** The server sends a _price_
> snapshot but **no `trade.update` snapshot** for the user's in-flight orders, so
> a terminal `done`/`expired`/`failed` that fires during a WS disconnect is
> unrecoverable over the socket. **Required:** on `subscribe` to `trades`, replay
> the current state of each open/recently-terminal order — and/or let the client
> reconcile after reconnect via REST `GET /trade/orders/{id}` + the open-orders
> list (`doc/trade/api.md`).

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

### Required additions (contract gaps)

The current frame (`lib/core/domain/realtime/events.ts`) carries a single
`amountCoin` and no reason/leg id. To line up with the REST order lifecycle:

- **`reason` on `failed` (#72):** a `failed` frame MUST carry a machine `reason`
  (same vocabulary as the REST reject reasons — `PRICE_BAND_BREACHED`,
  `NO_LIQUIDITY`, …) so the terminal toast can explain itself.
- **Partial fills / all-or-nothing (#72):** there is **no `filledAmountCoin` and
  no `partial` state** — `amountCoin` is the whole order and the model is
  all-or-nothing (matching `GET /trade/orders/{id}`). If partial venue fills are
  ever surfaced, add `filledAmountCoin`/`filledTotalIrt` and a `partially_filled`
  status in **both** this frame and the REST status; until then, all-or-nothing
  is the explicit contract.
- **Refund timing (#72):** `expired` and `failed` release the order's reserve
  **immediately** (see the refund-timing table in `doc/trade/api.md`); the
  released funds re-appear in the portfolio `available`/`locked` split (#73) and
  the movement lands in `/wallet/transactions` (which still needs an `expired`
  status — `doc/history/api.md`).
- **`venueTradeId` (#75, backend):** a `done`/settled frame SHOULD carry the
  upstream venue trade/leg id for reconciliation; not present in the contract yet.

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
