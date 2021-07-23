import { Module } from '@nestjs/common';
import { Connection } from '@solana/web3.js';

import { SOLANA_ENDPOINT_URL } from '../config';

export const WEB3_CONNECTION = 'WEB3_CONNECTION';
export { Connection as Web3Connection } from '@solana/web3.js';

const Web3ConnectionProvider = {
  provide: WEB3_CONNECTION,
  useFactory() {
    return new Connection(SOLANA_ENDPOINT_URL, { commitment: 'finalized' });
  },
};

@Module({
  providers: [Web3ConnectionProvider],
  exports: [Web3ConnectionProvider],
})
export class Web3Module {}
