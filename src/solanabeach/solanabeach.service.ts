import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { SOLANABEACH_API_URL, SOLANABEACH_API_KEY } from '../config';
import {
  StakeAccount,
  AccountTokenTransfer,
  StakeAccountReward,
} from './interfaces';

/* 
    API docs:
    https://app.swaggerhub.com/apis-docs/V2261/solanabeach-backend_api/0.0.1
*/

@Injectable()
export class SolanabeachService {
  private readonly logger = new Logger(SolanabeachService.name);

  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SOLANABEACH_API_URL,
      headers: { Authorization: `Bearer ${SOLANABEACH_API_KEY}` },
    });
  }

  private async _get<T>(
    url: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    let result: AxiosResponse;
    try {
      result = await this.client.get(url, { params });
    } catch (error) {
      this.logger.error(`url=${url} error=${error.message}`);
      throw new BadGatewayException();
    }
    if (result.status === 200) {
      return result.data;
    } else {
      this.logger.error(`url=${url} status=${result.status}`);
      throw new BadGatewayException();
    }
  }

  async getAccountStakes(pubkey: string, offset = 0, limit = 100) {
    return this._get<{ data: StakeAccount[]; totalPages: number }>(
      `/account/${pubkey}/stakes`,
      {
        limit,
        offset,
      },
    );
  }

  async getStakeRewards(
    pubkey: string,
    cursor?: number, // epoch
  ) {
    return this._get<StakeAccountReward[]>(`/account/${pubkey}/stake-rewards`, {
      cursor,
    });
  }

  async getTokenTransfers(
    pubkey: string,
    limit?: number,
    offset?: number,
    cursor?: string,
    inner?: boolean,
  ): Promise<AccountTokenTransfer[]> {
    return this._get<AccountTokenTransfer[]>(
      `/account/${pubkey}/token-transfers`,
      { limit, offset, cursor, inner },
    );
  }
}
