import { RequestOtpUseCase } from "@/lib/core/application/auth/use-cases/request-otp.use-case";
import { VerifyOtpUseCase } from "@/lib/core/application/auth/use-cases/verify-otp.use-case";
import { InquireIdentityUseCase } from "@/lib/core/application/kyc/use-cases/inquire-identity.use-case";
import { ListCoinsUseCase } from "@/lib/core/application/market/use-cases/list-coins.use-case";
import { GetMarketOverviewUseCase } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { GetCoinDetailUseCase } from "@/lib/core/application/market/use-cases/get-coin-detail.use-case";
import { GetPortfolioUseCase } from "@/lib/core/application/portfolio/use-cases/get-portfolio.use-case";
import { GetTradeContextUseCase } from "@/lib/core/application/trade/use-cases/get-trade-context.use-case";
import { PlaceOrderUseCase } from "@/lib/core/application/trade/use-cases/place-order.use-case";
import { MockAuthRepository } from "@/lib/infrastructure/auth/mock-auth.repository";
import { MockTradeRepository } from "@/lib/infrastructure/trade/mock-trade.repository";
import { MockTransactionsRepository } from "@/lib/infrastructure/wallet/mock-transactions.repository";
import { ListTransactionsUseCase } from "@/lib/core/application/wallet/use-cases/list-transactions.use-case";
import { DepositIrtUseCase } from "@/lib/core/application/wallet/use-cases/deposit-irt.use-case";
import { ManageCardsUseCase } from "@/lib/core/application/wallet/use-cases/manage-cards.use-case";
import { WithdrawUseCase } from "@/lib/core/application/wallet/use-cases/withdraw.use-case";
import { GetDepositAddressUseCase } from "@/lib/core/application/wallet/use-cases/get-deposit-address.use-case";
import { MockWalletRepository } from "@/lib/infrastructure/wallet/mock-wallet.repository";
import { GetProfileUseCase } from "@/lib/core/application/account/use-cases/get-profile.use-case";
import { MockUserRepository } from "@/lib/infrastructure/account/mock-user.repository";
import { MockPortfolioRepository } from "@/lib/infrastructure/portfolio/mock-portfolio.repository";
import { MockIdentityInquiryRepository } from "@/lib/infrastructure/kyc/mock-identity-inquiry.repository";
import { MockKycSessionStore } from "@/lib/infrastructure/kyc/mock-kyc-session-store";
import { MockMarketRepository } from "@/lib/infrastructure/market/mock-market.repository";
import { Container } from "./container";
import { TOKENS } from "./tokens";

/**
 * Composition root — the ONE place that knows about concrete implementations.
 * To move off mocks, swap the adapter registration here for an HTTP one; the
 * application and presentation layers are unaffected.
 */
export function buildContainer(): Container {
  const container = new Container();

  // Infrastructure: bind ports to adapters.
  container.registerSingleton(
    TOKENS.AuthRepository,
    () => new MockAuthRepository(),
  );
  container.registerSingleton(
    TOKENS.IdentityInquiryPort,
    () => new MockIdentityInquiryRepository(),
  );
  // Singleton: the pending-KYC map must survive between submit and confirm.
  container.registerSingleton(
    TOKENS.KycSessionStore,
    () => new MockKycSessionStore(),
  );
  container.registerSingleton(
    TOKENS.MarketRepository,
    () => new MockMarketRepository(),
  );
  container.registerSingleton(
    TOKENS.PortfolioRepository,
    () => new MockPortfolioRepository(),
  );
  container.registerSingleton(
    TOKENS.TradeRepository,
    () => new MockTradeRepository(),
  );
  container.registerSingleton(
    TOKENS.TransactionsRepository,
    () => new MockTransactionsRepository(),
  );
  container.registerSingleton(
    TOKENS.WalletRepository,
    () => new MockWalletRepository(),
    TOKENS.UserRepository,
    () => new MockUserRepository(),
  );

  // Application: construct use cases from their dependencies.
  container.register(
    TOKENS.RequestOtpUseCase,
    (c) => new RequestOtpUseCase(c.resolve(TOKENS.AuthRepository)),
  );
  container.register(
    TOKENS.VerifyOtpUseCase,
    (c) => new VerifyOtpUseCase(c.resolve(TOKENS.AuthRepository)),
  );
  container.register(
    TOKENS.InquireIdentityUseCase,
    (c) => new InquireIdentityUseCase(c.resolve(TOKENS.IdentityInquiryPort)),
  );
  container.register(
    TOKENS.ListCoinsUseCase,
    (c) => new ListCoinsUseCase(c.resolve(TOKENS.MarketRepository)),
  );
  container.register(
    TOKENS.GetMarketOverviewUseCase,
    (c) => new GetMarketOverviewUseCase(c.resolve(TOKENS.MarketRepository)),
  );
  container.register(
    TOKENS.GetCoinDetailUseCase,
    (c) => new GetCoinDetailUseCase(c.resolve(TOKENS.MarketRepository)),
  );
  container.register(
    TOKENS.GetPortfolioUseCase,
    (c) => new GetPortfolioUseCase(c.resolve(TOKENS.PortfolioRepository)),
  );
  container.register(
    TOKENS.GetTradeContextUseCase,
    (c) =>
      new GetTradeContextUseCase(
        c.resolve(TOKENS.MarketRepository),
        c.resolve(TOKENS.TradeRepository),
      ),
  );
  container.register(
    TOKENS.PlaceOrderUseCase,
    (c) =>
      new PlaceOrderUseCase(
        c.resolve(TOKENS.MarketRepository),
        c.resolve(TOKENS.TradeRepository),
      ),
  );
  container.register(
    TOKENS.ListTransactionsUseCase,
    (c) =>
      new ListTransactionsUseCase(c.resolve(TOKENS.TransactionsRepository)),
  );
  container.register(
    TOKENS.DepositIrtUseCase,
    (c) => new DepositIrtUseCase(c.resolve(TOKENS.WalletRepository)),
  );
  container.register(
    TOKENS.ManageCardsUseCase,
    (c) => new ManageCardsUseCase(c.resolve(TOKENS.WalletRepository)),
  );
  container.register(
    TOKENS.WithdrawUseCase,
    (c) =>
      new WithdrawUseCase(
        c.resolve(TOKENS.MarketRepository),
        c.resolve(TOKENS.TradeRepository),
        c.resolve(TOKENS.WalletRepository),
      ),
  );
  container.register(
    TOKENS.GetDepositAddressUseCase,
    (c) =>
      new GetDepositAddressUseCase(
        c.resolve(TOKENS.MarketRepository),
        c.resolve(TOKENS.WalletRepository),
      ),
    TOKENS.GetProfileUseCase,
    (c) => new GetProfileUseCase(c.resolve(TOKENS.UserRepository)),
  );
  return container;
}

/** Process-wide container used by the presentation layer (server actions). */
export const container = buildContainer();
