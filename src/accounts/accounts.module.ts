import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Web3Module } from 'src/web3/web3.module';

import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { BalanceCheckerService } from './balance-checker.service';
import { StakeAccount } from './entities/stake-account.entity';
import { StakeReward } from './entities/stake-rewards.entity';
import { UserAccount } from './entities/user-account.entity';
import { Validator } from './entities/validator.entity';
import { SolanabeachService } from './solanabeach.service';
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
  ],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    BalanceCheckerService,
    SolPowerCheckerService,
    SolanabeachService,
  ],
})
export class AccountsModule {}
