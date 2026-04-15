import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Duffel } from '@duffel/api';

type JsonMap = Record<string, unknown>;

interface DuffelClient {
  offerRequests: {
    create(payload: JsonMap): Promise<unknown>;
  };
  offers: {
    list(params: JsonMap): Promise<unknown>;
    get(offerId: string): Promise<unknown>;
  };
}

@Injectable()
export class DuffelService {
  private readonly duffel: DuffelClient;
  private readonly timeoutMs: number;

  constructor() {
    const token = process.env.DUFFEL_API_KEY;
    if (!token) {
      throw new InternalServerErrorException('DUFFEL_API_KEY not configured');
    }

    this.timeoutMs = Number(process.env.DUFFEL_TIMEOUT_MS || 130000);
    this.duffel = new Duffel({ token }) as unknown as DuffelClient;
  }

  async createOfferRequest(payload: JsonMap): Promise<unknown> {
    return this.executeDuffelCall(() =>
      this.duffel.offerRequests.create(payload),
    );
  }

  // Duffel supports cursor pagination through after/limit query params.
  async listOffers(offerRequestId: string, after?: string, limit?: string) {
    const params: JsonMap = { offer_request_id: offerRequestId };

    if (after) params.after = after;
    if (limit) params.limit = limit;

    return this.executeDuffelCall(() => this.duffel.offers.list(params));
  }

  async getOfferById(offerId: string): Promise<unknown> {
    return this.executeDuffelCall(() => this.duffel.offers.get(offerId));
  }

  private async executeDuffelCall<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await this.withTimeout(action(), this.timeoutMs);
    } catch (error: unknown) {
      this.handleDuffelError(error);
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new GatewayTimeoutException(
            `Duffel request exceeded ${timeoutMs}ms timeout`,
          ),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private handleDuffelError(error: unknown): never {
    if (error instanceof GatewayTimeoutException) {
      throw error;
    }

    const status = Number(
      this.pick(error, ['status']) ??
        this.pick(error, ['response', 'status']) ??
        0,
    );

    const requestId =
      this.pick(error, ['headers', 'x-request-id']) ??
      this.pick(error, ['response', 'headers', 'x-request-id']) ??
      this.pick(error, ['meta', 'request_id']);

    const details = {
      message:
        this.asString(this.pick(error, ['message'])) ?? 'Duffel API error',
      type:
        this.asString(this.pick(error, ['type'])) ??
        this.asString(this.pick(error, ['errors', '0', 'type'])),
      code:
        this.asString(this.pick(error, ['code'])) ??
        this.asString(this.pick(error, ['errors', '0', 'code'])),
      requestId,
    };

    if (status >= 400 && status < 500) {
      throw new BadGatewayException({
        error: 'Duffel client error',
        ...details,
      });
    }

    throw new BadGatewayException({
      error: 'Duffel upstream error',
      ...details,
    });
  }

  private pick(source: unknown, path: string[]): unknown {
    let current: unknown = source;

    for (const segment of path) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }

      const map = current as Record<string, unknown>;
      current = map[segment];
    }

    return current;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
