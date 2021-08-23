export interface Address {
  address: string;
  name?: string;
  logo?: string;
  ticker?: string;
  cmcId?: string;
  meta?: unknown;
}

export interface StakeAccount {
  pubkey: Address;
  lamports: number;
  data: {
    state: number;
    meta: {
      rent_exempt_reserve: number;
      authorized: {
        staker: Address;
        withdrawer: Address;
      };
    };
    lockup: {
      unix_timestamp: number;
      epoch: number;
      custodian: string;
    };
    stake: {
      delegation: {
        voter_pubkey: Address;
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

export interface TransferInstruction {
  Transfer: {
    amount: number;
    source: Address;
    destination: Address;
    owner: Address;
    signers: Address[];
    writable: Address[];
    mint: Address;
    decimals: number;
  };
}

export interface Transaction {
  transactionHash: string;
  blockNumber: number;
  index: number;
  accounts: Array<{ account: { address: string }; signer: boolean }>;
  header: {
    numRequiredSignatures: number;
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
  };
  instructions: [
    {
      parsed: TransferInstruction | unknown;
      programId: {
        name: string;
        address: string;
      };
    },
  ];
  recentBlockhash: string;
  signatures: string[];
  meta: {
    err: unknown;
    fee: number;
    status: unknown;
    rewards: unknown[];
    logMessages: string[];
    preBalances: number[];
    postBalances: number[];
    preTokenBalances: Array<{
      mint: Address;
      accountIndex: number;
      uiTokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number;
        uiAmountString: string;
      };
    }>;
    postTokenBalances: Array<{
      mint: Address;
      accountIndex: number;
      uiTokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number;
        uiAmountString: string;
      };
    }>;
  };
  valid: boolean;
  blocktime: Timestamp;
  mostImportantInstruction: {
    name: string;
    weight: number;
    index: number;
  };
  smart: Array<{
    type: string;
    value: unknown;
  }>;
}
