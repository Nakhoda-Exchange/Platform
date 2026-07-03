import { token } from "./token";
import type { AuthRepository } from "@/lib/core/application/auth/ports/auth-repository.port";
import type { RequestOtpUseCase } from "@/lib/core/application/auth/use-cases/request-otp.use-case";
import type { VerifyOtpUseCase } from "@/lib/core/application/auth/use-cases/verify-otp.use-case";
import type { IdentityInquiryPort } from "@/lib/core/application/kyc/ports/identity-inquiry.port";
import type { KycSessionStore } from "@/lib/core/application/kyc/ports/kyc-session-store.port";
import type { InquireIdentityUseCase } from "@/lib/core/application/kyc/use-cases/inquire-identity.use-case";
import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { ListCoinsUseCase } from "@/lib/core/application/market/use-cases/list-coins.use-case";

/** Central registry of injection tokens, grouped by layer. */
export const TOKENS = {
  // Ports (implemented by infrastructure adapters)
  AuthRepository: token<AuthRepository>("AuthRepository"),
  IdentityInquiryPort: token<IdentityInquiryPort>("IdentityInquiryPort"),
  KycSessionStore: token<KycSessionStore>("KycSessionStore"),
  MarketRepository: token<MarketRepository>("MarketRepository"),
  // Application use cases
  RequestOtpUseCase: token<RequestOtpUseCase>("RequestOtpUseCase"),
  VerifyOtpUseCase: token<VerifyOtpUseCase>("VerifyOtpUseCase"),
  InquireIdentityUseCase: token<InquireIdentityUseCase>(
    "InquireIdentityUseCase",
  ),
  ListCoinsUseCase: token<ListCoinsUseCase>("ListCoinsUseCase"),
} as const;
