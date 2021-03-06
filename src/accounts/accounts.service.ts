import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Not, Repository } from 'typeorm';
import * as BN from 'bn.js';

import { UserAccount } from './entities/user-account.entity';
import { StakeAccount } from './entities/stake-account.entity';
import { Validator } from './entities/validator.entity';
import { StakeReward } from './entities/stake-rewards.entity';
import { WEB3_CONNECTION, Web3Connection } from '../web3/web3.module';
import { SolanabeachService } from '../solanabeach/solanabeach.service';
import { getProcessType, ProcessType } from '../cluster';

const UPDATE_ACCOUNTS_PER_RUN = 10;

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  private lastEpoch?: number;
  private isUpdateAccountsWorking = false;

  constructor(
    private readonly solanabeachService: SolanabeachService,
    @InjectRepository(UserAccount)
    private readonly userAccountRepo: Repository<UserAccount>,
    @InjectRepository(StakeAccount)
    private readonly stakeAccountRepo: Repository<StakeAccount>,
    @InjectRepository(StakeReward)
    private readonly stakeRewardRepo: Repository<StakeReward>,
    @InjectRepository(Validator)
    private readonly validatorRepo: Repository<Validator>,
    @Inject(WEB3_CONNECTION)
    private readonly web3: Web3Connection,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    if (getProcessType() === ProcessType.Worker) {
      {
        this.logger.log(`Starting cron job updateAccounts`);

        const job = new CronJob(CronExpression.EVERY_SECOND, async () => {
          await this.updateAccounts();
        });

        this.schedulerRegistry.addCronJob('updateAccounts', job);
        job.start();
      }

      {
        this.logger.log(`Starting cron job updateEpoch`);

        const job = new CronJob(CronExpression.EVERY_MINUTE, async () => {
          await this.updateEpoch();
        });

        this.schedulerRegistry.addCronJob('updateEpoch', job);
        job.start();
      }
    }
  }

  async updateAccounts() {
    if (this.isUpdateAccountsWorking) {
      return;
    }

    this.isUpdateAccountsWorking = true;

    const accountsToUpdate = await this.userAccountRepo.find({
      where: { isUpdateNeeded: true },
      take: UPDATE_ACCOUNTS_PER_RUN,
    });

    if (accountsToUpdate.length) {
      this.logger.log(`Found ${accountsToUpdate.length} accounts to update`);
    }

    for (const account of accountsToUpdate) {
      await this.fetchStakeAccounts(account.publicKey);
    }

    this.isUpdateAccountsWorking = false;
  }

  async updateEpoch() {
    const { epoch } = await this.web3.getEpochInfo();
    if (this.lastEpoch !== epoch) {
      this.logger.log(`New epoch: ${epoch}`);
      const { affected } = await this.userAccountRepo.update(
        { solPowerEpoch: Not(epoch.toString()) },
        { isUpdateNeeded: true },
      );
      this.logger.log(`Accounts to update: ${affected}`);
      this.lastEpoch = epoch;
    }
  }

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

  async fetchStakeAccounts(address: string) {
    const logPrefix = `[getStakeAccounts;${address}]`;

    const userAccount = await this.userAccountRepo.findOne({
      where: { publicKey: address },
    });

    if (!userAccount) {
      this.logger.error(`${logPrefix} Account not found`);
      throw new Error(`User account not found`);
    }

    const { epoch } = await this.web3.getEpochInfo();

    if (
      userAccount.solPowerEpoch === epoch.toString() &&
      !userAccount.isUpdateNeeded
    ) {
      return { lamports: new BN(userAccount.solPowerAmount) };
    }

    this.logger.debug(
      `${logPrefix} userAccount=${userAccount.id} epoch=${epoch}`,
    );

    const limit = 100;
    let offset = 0;
    let total = new BN(0);
    while (true) {
      this.logger.debug(
        `${logPrefix} Fetching stakes offset=${offset}, limit=${limit}`,
      );

      const { lamports, totalPages } = await this.fetchStakeAcountsPage(
        userAccount,
        address,
        offset,
        limit,
      );

      total = total.add(lamports);

      offset += limit;
      if (Math.floor(offset / limit) >= totalPages) {
        break;
      }
    }

    this.logger.verbose(`${logPrefix} SolPower=${total}`);

    userAccount.solPowerAmount = total.toString();
    userAccount.solPowerEpoch = epoch.toString();
    userAccount.isUpdateNeeded = false;

    await this.userAccountRepo.save(userAccount);

    return { lamports: total };
  }

  private async fetchStakeAcountsPage(
    userAccount: UserAccount,
    address: string,
    offset: number,
    limit: number,
  ) {
    const { data, totalPages } = await this.solanabeachService.getAccountStakes(
      address,
      offset,
      limit,
    );

    let total = new BN(0);

    for (const item of data) {
      const publicKey = item.pubkey?.address;
      if (!publicKey) {
        continue;
      }

      const logPrefix = `[getStakeAccounts;${address};${publicKey}]`;

      const delegation = item.data?.stake?.delegation;
      if (!delegation) {
        this.logger.debug(`${logPrefix} Skipping non-delegated stake`);
        continue;
      }

      const validatorKey = delegation.validatorInfo?.identityPubkey;
      if (!validatorKey) {
        this.logger.debug(`${logPrefix} Validator not identified`);
        continue;
      }

      let validator = await this.validatorRepo.findOne({
        where: { identityAccount: validatorKey },
      });
      if (!validator) {
        validator = new Validator();
        validator.identityAccount = validatorKey;
        validator.voteAccount = delegation.voter_pubkey.address;
        validator.isWhitelisted = false;
        await this.validatorRepo.save(validator);
        this.logger.verbose(
          `${logPrefix} Validator identity created ${validatorKey}`,
        );
        continue;
      } else if (!validator.isWhitelisted) {
        this.logger.debug(`${logPrefix} Unlisted validator`);
        continue;
      }

      this.logger.debug(`${logPrefix} Validator ${validator.identityAccount}`);

      let stakeAccount = await this.stakeAccountRepo.findOne({
        where: { publicKey: item.pubkey.address },
      });

      if (!stakeAccount) {
        stakeAccount = new StakeAccount();
        stakeAccount.publicKey = item.pubkey.address;
        stakeAccount.userAccountId = userAccount.id;
        stakeAccount.validatorId = validator.id;
        const saved = await this.stakeAccountRepo.save(stakeAccount);
        this.logger.verbose(`${logPrefix} Created id=${saved.id}`);
      }

      const { lamports } = await this.fetchStakeRewards(stakeAccount);
      total = total.add(lamports);
    }

    return { lamports: total, totalPages };
  }

  private async fetchStakeRewards(stakeAccount: StakeAccount) {
    let total = new BN(0);
    let epoch: number | undefined;
    const logPrefix = `[fetchStakeRewards;${stakeAccount.publicKey}]`;

    const latestReward = await this.stakeRewardRepo.findOne({
      where: { stakeAccountId: stakeAccount.id },
      order: { epoch: 'DESC' },
    });

    const { sum } = await this.stakeRewardRepo
      .createQueryBuilder('sr')
      .select('SUM(sr.amount)', 'sum')
      .where({ stakeAccountId: stakeAccount.id })
      .getRawOne();

    if (sum && sum != 0) {
      this.logger.log(
        `${logPrefix} Previously saved SolPower=${sum} epoch=${latestReward.epoch}`,
      );
      total = total.add(new BN(sum));
    }

    let hasReachedHistory = false;
    while (true) {
      if (hasReachedHistory) {
        this.logger.debug(`${logPrefix} Reached known history`);
        break;
      }

      const rewards = await this.solanabeachService.getStakeRewards(
        stakeAccount.publicKey,
        epoch,
      );

      if (rewards.length === 0) {
        this.logger.debug(`${logPrefix} Exhausted rewards cursor=${epoch}`);
        break;
      }

      this.logger.debug(
        `${logPrefix} Found rewards count=${rewards.length} cursor=${epoch}`,
      );

      epoch = rewards[rewards.length - 1].epoch;

      for (const reward of rewards) {
        if (latestReward && reward.epoch <= Number(latestReward.epoch)) {
          hasReachedHistory = true;
          break;
        }

        const stakeReward = new StakeReward();
        stakeReward.amount = reward.amount;
        stakeReward.epoch = reward.epoch.toString();
        stakeReward.stakeAccountId = stakeAccount.id;
        stakeReward.slot = reward.effectiveSlot.toString();
        const saved = await this.stakeRewardRepo.save(stakeReward);
        this.logger.verbose(
          `${logPrefix} Saved id=${saved.id} epoch=${reward.epoch}`,
        );

        total = total.add(new BN(stakeReward.amount));

        if (reward.epoch < epoch) {
          epoch = reward.epoch;
        }
      }
    }

    return { lamports: total };
  }

  async checkUserAccount(publicKey: string) {
    const count = await this.userAccountRepo.count({ where: { publicKey } });
    return count > 0;
  }

  async findOne(id: number) {
    return this.userAccountRepo.findOneOrFail({ where: { id } }).catch(() => {
      throw new NotFoundException();
    });
  }

  async getAccountSolPower(publicKey: string): Promise<string | undefined> {
    const account = await this.userAccountRepo.findOne({ publicKey });

    if (account) {
      return account.solPowerAmount;
    }

    return;
  }
}
