import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "@/lib/core/application/portfolio/ports/portfolio-repository.port";
import type { PortfolioHistory } from "@/lib/core/domain/portfolio/portfolio-history";
import type { Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** HTTP adapter for the portfolio. Contract: doc/portfolio/api.md. */
export class HttpPortfolioRepository implements PortfolioRepository {
  constructor(private readonly http: HttpClient) {}

  getPortfolio(): Promise<Result<PortfolioSnapshot>> {
    return this.http.get<PortfolioSnapshot>("/portfolio");
  }

  getPortfolioHistory(): Promise<Result<PortfolioHistory>> {
    return this.http.get<PortfolioHistory>("/portfolio/history");
  }
}
