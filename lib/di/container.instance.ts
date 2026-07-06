import { RequestOtpUseCase } from "@/lib/core/application/auth/use-cases/request-otp.use-case";
import { VerifyOtpUseCase } from "@/lib/core/application/auth/use-cases/verify-otp.use-case";
import { InquireIdentityUseCase } from "@/lib/core/application/kyc/use-cases/inquire-identity.use-case";
import { ListCoinsUseCase } from "@/lib/core/application/market/use-cases/list-coins.use-case";
import { GetMarketOverviewUseCase } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { GetCoinDetailUseCase } from "@/lib/core/application/market/use-cases/get-coin-detail.use-case";
import { GetPortfolioUseCase } from "@/lib/core/application/portfolio/use-cases/get-portfolio.use-case";
import { GetPortfolioHistoryUseCase } from "@/lib/core/application/portfolio/use-cases/get-portfolio-history.use-case";
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
import { TwoStepPasswordUseCase } from "@/lib/core/application/account/use-cases/two-step-password.use-case";
import { MockUserRepository } from "@/lib/infrastructure/account/mock-user.repository";
import { MockAnnouncementsRepository } from "@/lib/infrastructure/account/mock-announcements.repository";
import { ListAnnouncementsUseCase } from "@/lib/core/application/account/use-cases/list-announcements.use-case";
import { GetReferralOverviewUseCase } from "@/lib/core/application/referral/use-cases/get-referral-overview.use-case";
import { MockReferralRepository } from "@/lib/infrastructure/referral/mock-referral.repository";
import { MockConfigRepository } from "@/lib/infrastructure/config/mock-config.repository";
import { GetCurrencyUnitsUseCase } from "@/lib/core/application/config/use-cases/get-currency-units.use-case";
import { MockPortfolioRepository } from "@/lib/infrastructure/portfolio/mock-portfolio.repository";
import { MockIdentityInquiryRepository } from "@/lib/infrastructure/kyc/mock-identity-inquiry.repository";
import { MockKycSessionStore } from "@/lib/infrastructure/kyc/mock-kyc-session-store";
import { MockMarketRepository } from "@/lib/infrastructure/market/mock-market.repository";
import { HttpClient } from "@/lib/infrastructure/http/http-client";
import { authAndLocaleInterceptor } from "@/lib/infrastructure/http/interceptors";
import { HttpAuthRepository } from "@/lib/infrastructure/auth/http-auth.repository";
import { HttpIdentityInquiryRepository } from "@/lib/infrastructure/kyc/http-identity-inquiry.repository";
import { HttpMarketRepository } from "@/lib/infrastructure/market/http-market.repository";
import { HttpPortfolioRepository } from "@/lib/infrastructure/portfolio/http-portfolio.repository";
import { HttpTradeRepository } from "@/lib/infrastructure/trade/http-trade.repository";
import { HttpTransactionsRepository } from "@/lib/infrastructure/wallet/http-transactions.repository";
import { HttpWalletRepository } from "@/lib/infrastructure/wallet/http-wallet.repository";
import { HttpUserRepository } from "@/lib/infrastructure/account/http-user.repository";
import { HttpAnnouncementsRepository } from "@/lib/infrastructure/account/http-announcements.repository";
import { HttpReferralRepository } from "@/lib/infrastructure/referral/http-referral.repository";
import { HttpConfigRepository } from "@/lib/infrastructure/config/http-config.repository";
import { Container } from "./container";
import { TOKENS } from "./tokens";

/**
 * Composition root — the ONE place that knows about concrete implementations.
 * To move off mocks, swap the adapter registration here for an HTTP one; the
 * application and presentation layers are unaffected.
 */
/**
 * Backend integration switch: with API_BASE_URL set (server env), every port
 * binds to its HTTP adapter over the shared HttpClient; without it, the
 * in-memory mocks serve — so the app runs standalone until the backend is up,
 * and cutting over is configuration, not code. Contracts: doc/<feature>/api.md.
 */
const API_BASE_URL = process.env.API_BASE_URL;

function registerHttpAdapters(container: Container, baseUrl: string): void {
  const http = new HttpClient({
    baseUrl,
    requestInterceptors: [authAndLocaleInterceptor],
  });

  container.registerSingleton(
    TOKENS.AuthRepository,
    () => new HttpAuthRepository(http),
  );
  container.registerSingleton(
    TOKENS.IdentityInquiryPort,
    () => new HttpIdentityInquiryRepository(http),
  );
  // KYC session store stays in-process either way: it is presentation-side
  // plumbing between the inquiry and confirm steps, not backend state.
  container.registerSingleton(
    TOKENS.KycSessionStore,
    () => new MockKycSessionStore(),
  );
  container.registerSingleton(
    TOKENS.MarketRepository,
    () => new HttpMarketRepository(http),
  );
  container.registerSingleton(
    TOKENS.PortfolioRepository,
    () => new HttpPortfolioRepository(http),
  );
  container.registerSingleton(
    TOKENS.TradeRepository,
    () => new HttpTradeRepository(http),
  );
  container.registerSingleton(
    TOKENS.TransactionsRepository,
    () => new HttpTransactionsRepository(http),
  );
  container.registerSingleton(
    TOKENS.WalletRepository,
    () => new HttpWalletRepository(http),
  );
  container.registerSingleton(
    TOKENS.UserRepository,
    () => new HttpUserRepository(http),
  );
  container.registerSingleton(
    TOKENS.AnnouncementsRepository,
    () => new HttpAnnouncementsRepository(http),
  );
  container.registerSingleton(
    TOKENS.ReferralRepository,
    () => new HttpReferralRepository(http),
  );
  container.registerSingleton(
    TOKENS.ConfigRepository,
    () => new HttpConfigRepository(http),
  );
}

export function buildContainer(): Container {
  const container = new Container();

  if (API_BASE_URL) {
    registerHttpAdapters(container, API_BASE_URL);
    registerUseCases(container);
    return container;
  }

  // Infrastructure: bind ports to adapters (in-memory mocks).
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
  );
  container.registerSingleton(
    TOKENS.UserRepository,
    () => new MockUserRepository(),
  );
  container.registerSingleton(
    TOKENS.AnnouncementsRepository,
    () => new MockAnnouncementsRepository(),
  );
  container.registerSingleton(
    TOKENS.ReferralRepository,
    () => new MockReferralRepository(),
  );
  container.registerSingleton(
    TOKENS.ConfigRepository,
    () => new MockConfigRepository(),
  );

  registerUseCases(container);
  return container;
}

function registerUseCases(container: Container): void {
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
    TOKENS.GetPortfolioHistoryUseCase,
    (c) =>
      new GetPortfolioHistoryUseCase(c.resolve(TOKENS.PortfolioRepository)),
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
  );
  container.register(
    TOKENS.GetProfileUseCase,
    (c) => new GetProfileUseCase(c.resolve(TOKENS.UserRepository)),
  );
  container.register(
    TOKENS.TwoStepPasswordUseCase,
    (c) => new TwoStepPasswordUseCase(c.resolve(TOKENS.UserRepository)),
  );
  container.register(
    TOKENS.ListAnnouncementsUseCase,
    (c) =>
      new ListAnnouncementsUseCase(c.resolve(TOKENS.AnnouncementsRepository)),
  );
  container.register(
    TOKENS.GetReferralOverviewUseCase,
    (c) => new GetReferralOverviewUseCase(c.resolve(TOKENS.ReferralRepository)),
  );
  container.register(
    TOKENS.GetCurrencyUnitsUseCase,
    (c) => new GetCurrencyUnitsUseCase(c.resolve(TOKENS.ConfigRepository)),
  );
}

/** Process-wide container used by the presentation layer (server actions). */
export const container = buildContainer();
