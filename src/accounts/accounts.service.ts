import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as BN from 'bn.js';

import { UserAccount } from './entities/user-account.entity';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccountRepo: Repository<UserAccount>,
  ) {}

  async updateBalance(address: string, lamports: number): Promise<boolean> {
    try {
      const balance = new BN(lamports).toString();
      let userAccount = await this.userAccountRepo.findOne({
        publicKey: address,
      });
      if (userAccount) {
        await this.userAccountRepo.update({ publicKey: address }, { balance });
      } else {
        userAccount = new UserAccount();
        userAccount.publicKey = address;
        userAccount.balance = balance;
        await this.userAccountRepo.save(userAccount);
        this.logger.verbose(
          `Account with address ${address} has been registered`,
        );
      }
      return true;
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }

  async getStakeAccounts(address: string) {
    address;
    return [];
  }

  async getStakeRewards(address: string) {
    address;
    return [];
  }
}
