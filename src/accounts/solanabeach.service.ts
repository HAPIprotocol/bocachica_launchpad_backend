import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';

import { SOLANABEACH_API_KEY } from '../config';

/* 
    API docs:
    https://app.swaggerhub.com/apis-docs/V2261/solanabeach-backend_api/0.0.1
*/

interface StakeAccount {
  pubkey: string;
  lamports: number;
  data: {
    state: number;
    meta: {
      rent_exempt_reserve: number;
      authorized: {
        staker: { address: string };
        withdrawer: { address: string };
      };
    };
    lockup: {
      unix_timestamp: number;
      epoch: number;
      custodian: string;
    };
    stake: {
      delegation: {
        voter_pubkey: { address: string };
        stake: number;
        activation_epoch: number;
        deactivation_epoch: number;
        warmup_cooldown_rate: number;
        validatorInfo: {
          name: string;
          image: string;
          website: string;
          identityPubkey: string;
        };
      };
      credits_observed: number;
    };
  };
}

interface StakeAccountReward {
  epoch: number;
  effectiveSlot: number;
  amount: string;
  postBalance: string;
  percentChange: number;
  apr: number;
}

@Injectable()
export class SolanabeachService {
  client = axios.create({
    baseURL: 'https://api.solanabeach.io/v1/',
    headers: { Authorization: `Bearer ${SOLANABEACH_API_KEY}` },
  });

  async getAccountStakes(
    pubkey: string,
    offset = 0,
    limit = 100,
  ): Promise<{ data: StakeAccount[]; totalPages: number }> {
    const result = await this.client.get(`/account/${pubkey}/stakes`, {
      params: { limit, offset },
    });
    if (result.status === 200) {
      return result.data;
    } else {
      throw new BadGatewayException();
    }
  }

  async getStakeRewards(
    pubkey: string,
    cursor: number, // epoch
  ): Promise<StakeAccountReward[]> {
    const result = await this.client.get(`/account/${pubkey}/stake-rewards`, {
      params: { cursor },
    });
    if (result.status === 200) {
      return result.data;
    } else {
      throw new BadGatewayException();
    }
  }
}
