import { token } from "./token";
import type { AuthRepository } from "@/lib/core/application/auth/ports/auth-repository.port";
import type { RequestOtpUseCase } from "@/lib/core/application/auth/use-cases/request-otp.use-case";
import type { VerifyOtpUseCase } from "@/lib/core/application/auth/use-cases/verify-otp.use-case";
import type { IdentityInquiryPort } from "@/lib/core/application/kyc/ports/identity-inquiry.port";
import type { KycSessionStore } from "@/lib/core/application/kyc/ports/kyc-session-store.port";
import type { InquireIdentityUseCase } from "@/lib/core/application/kyc/use-cases/inquire-identity.use-case";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { ListCoinsUseCase } from "@/lib/core/application/market/use-cases/list-coins.use-case";
import type { GetMarketOverviewUseCase } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import type { GetCoinDetailUseCase } from "@/lib/core/application/market/use-cases/get-coin-detail.use-case";
import type { PortfolioRepository } from "@/lib/core/application/portfolio/ports/portfolio-repository.port";
import type { GetPortfolioUseCase } from "@/lib/core/application/portfolio/use-cases/get-portfolio.use-case";
import type { TradeRepository } from "@/lib/core/application/trade/ports/trade-repository.port";
import type { GetTradeContextUseCase } from "@/lib/core/application/trade/use-cases/get-trade-context.use-case";
import type { PlaceOrderUseCase } from "@/lib/core/application/trade/use-cases/place-order.use-case";
import type { TransactionsRepository } from "@/lib/core/application/wallet/ports/transactions-repository.port";
import type { ListTransactionsUseCase } from "@/lib/core/application/wallet/use-cases/list-transactions.use-case";
import type { UserRepository } from "@/lib/core/application/account/ports/user-repository.port";
import type { GetProfileUseCase } from "@/lib/core/application/account/use-cases/get-profile.use-case";

/** Central registry of injection tokens, grouped by layer. */
export const TOKENS = {
  // Ports (implemented by infrastructure adapters)
  AuthRepository: token<AuthRepository>("AuthRepository"),
  IdentityInquiryPort: token<IdentityInquiryPort>("IdentityInquiryPort"),
  KycSessionStore: token<KycSessionStore>("KycSessionStore"),
  MarketRepository: token<MarketRepository>("MarketRepository"),
  PortfolioRepository: token<PortfolioRepository>("PortfolioRepository"),
  TradeRepository: token<TradeRepository>("TradeRepository"),
  TransactionsRepository: token<TransactionsRepository>(
    "TransactionsRepository",
  ),
  UserRepository: token<UserRepository>("UserRepository"),
  // Application use cases
  RequestOtpUseCase: token<RequestOtpUseCase>("RequestOtpUseCase"),
  VerifyOtpUseCase: token<VerifyOtpUseCase>("VerifyOtpUseCase"),
  InquireIdentityUseCase: token<InquireIdentityUseCase>(
    "InquireIdentityUseCase",
  ),
  ListCoinsUseCase: token<ListCoinsUseCase>("ListCoinsUseCase"),
  GetMarketOverviewUseCase: token<GetMarketOverviewUseCase>(
    "GetMarketOverviewUseCase",
  ),
  GetCoinDetailUseCase: token<GetCoinDetailUseCase>("GetCoinDetailUseCase"),
  GetPortfolioUseCase: token<GetPortfolioUseCase>("GetPortfolioUseCase"),
  GetTradeContextUseCase: token<GetTradeContextUseCase>(
    "GetTradeContextUseCase",
  ),
  PlaceOrderUseCase: token<PlaceOrderUseCase>("PlaceOrderUseCase"),
  ListTransactionsUseCase: token<ListTransactionsUseCase>(
    "ListTransactionsUseCase",
  ),
  GetProfileUseCase: token<GetProfileUseCase>("GetProfileUseCase"),
} as const;
