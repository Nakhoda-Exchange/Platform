import { token } from "./token";
import type { AuthRepository } from "@/lib/core/application/auth/ports/auth-repository.port";
import type { RequestOtpUseCase } from "@/lib/core/application/auth/use-cases/request-otp.use-case";
import type { VerifyOtpUseCase } from "@/lib/core/application/auth/use-cases/verify-otp.use-case";

/** Central registry of injection tokens, grouped by layer. */
export const TOKENS = {
  // Ports (implemented by infrastructure adapters)
  AuthRepository: token<AuthRepository>("AuthRepository"),
  // Application use cases
  RequestOtpUseCase: token<RequestOtpUseCase>("RequestOtpUseCase"),
  VerifyOtpUseCase: token<VerifyOtpUseCase>("VerifyOtpUseCase"),
} as const;
