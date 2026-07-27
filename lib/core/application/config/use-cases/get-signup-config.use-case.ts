import type { SignupConfig } from "@/lib/core/domain/config/signup-config";
import type { Result } from "@/lib/core/domain/shared/result";
import type { ConfigRepository } from "../ports/config-repository.port";

/**
 * Loads whether registration is invite-only, so the KYC screen knows whether to
 * require the invite-code field.
 */
export class GetSignupConfigUseCase {
  constructor(private readonly config: ConfigRepository) {}

  execute(): Promise<Result<SignupConfig>> {
    return this.config.getSignupConfig();
  }
}
