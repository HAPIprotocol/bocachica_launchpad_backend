export interface StakeAccount {
  pubkey: { address: string };
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

export interface StakeAccountReward {
  epoch: number;
  effectiveSlot: number;
  amount: string;
  postBalance: string;
  percentChange: number;
  apr: number;
}

export interface Address {
  address: string;
  name?: string;
  logo?: string;
  ticker?: string;
  cmcId?: string;
}

export interface Timestamp {
  absolute: number;
  relative: number;
}

export interface AccountTokenTransfer {
  blocknumber: number;
  txhash: string;
  mint: Address;
  valid: boolean;
  amount: number;
  source: Address;
  destination: Address;
  inner: boolean;
  txindex: number;
  timestamp: Timestamp;
  decimals: number;
}
