import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';

import { UserAccount } from './entities/user-account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccountRepo: Repository<UserAccount>,
  ) {}

  async updateBalance(address: string, lamports: number): Promise<boolean> {
    try {
      const balance = new BN(lamports).div(new BN(LAMPORTS_PER_SOL)).toString();
      await this.userAccountRepo.update({ publicKey: address }, { balance });
      return true;
    } catch (_) {
      return false;
    }
  }
}
