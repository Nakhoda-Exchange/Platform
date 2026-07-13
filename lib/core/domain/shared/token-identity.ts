/**
 * A token's on-chain identity — the key every on-chain data provider is keyed
 * on. Lives in shared/ because both the market `Coin` and the insights layer
 * reference it; neither domain should own the other's dependency.
 */

/** Chains we can resolve on-chain token data for. */
export type Chain = "solana" | "ethereum" | "bsc" | "base";

/** Present only for on-chain (meme) coins; majors like BTC have no such pair. */
export interface TokenIdentity {
  chain: Chain;
  address: string; // mint (Solana) or contract (EVM); lowercased for EVM
  pairAddress?: string; // primary DEX pair, when known
}
