import { RequestOtpUseCase } from "@/lib/core/application/auth/use-cases/request-otp.use-case";
import { VerifyOtpUseCase } from "@/lib/core/application/auth/use-cases/verify-otp.use-case";
import { InquireIdentityUseCase } from "@/lib/core/application/kyc/use-cases/inquire-identity.use-case";
import { ListCoinsUseCase } from "@/lib/core/application/market/use-cases/list-coins.use-case";
import { GetMarketOverviewUseCase } from "@/lib/core/application/market/use-cases/get-market-overview.use-case";
import { GetPortfolioUseCase } from "@/lib/core/application/portfolio/use-cases/get-portfolio.use-case";
import { MockAuthRepository } from "@/lib/infrastructure/auth/mock-auth.repository";
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
    TOKENS.GetPortfolioUseCase,
    (c) => new GetPortfolioUseCase(c.resolve(TOKENS.PortfolioRepository)),
  );

  return container;
}

/** Process-wide container used by the presentation layer (server actions). */
export const container = buildContainer();
