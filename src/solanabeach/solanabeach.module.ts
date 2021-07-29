import { Module } from '@nestjs/common';

import { SolanabeachService } from './solanabeach.service';

@Module({
  providers: [SolanabeachService],
})
export class SolanabeachModule {}
