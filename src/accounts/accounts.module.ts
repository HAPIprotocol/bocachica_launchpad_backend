import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SolanabeachModule } from '../solanabeach/solanabeach.module';
import { Web3Module } from '../web3/web3.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { BalanceCheckerService } from './balance-checker.service';
import { StakeAccount } from './entities/stake-account.entity';
import { StakeReward } from './entities/stake-rewards.entity';
import { UserAccount } from './entities/user-account.entity';
import { Validator } from './entities/validator.entity';
import { SolPowerCheckerService } from './solpower-checker.service';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([
      UserAccount,
      StakeAccount,
      StakeReward,
      Validator,
    ]),
    Web3Module,
    SolanabeachModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, BalanceCheckerService, SolPowerCheckerService],
})
export class AccountsModule {}
