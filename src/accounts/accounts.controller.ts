import {
  CacheInterceptor,
  CacheTTL,
  Controller,
  Get,
  NotFoundException,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AccountsService } from './accounts.service';
import { BalanceCheckerService } from './balance-checker.service';
import { GetBalanceDto } from './dto/get-balance.dto';
import { GetSolPowerDto } from './dto/get-solpower.dto';
import { SolPowerCheckerService } from './solpower-checker.service';

const BALANCE_CACHE_TTL = 60;
const SOLPOWER_CACHE_TTL = 120;

@UseInterceptors(CacheInterceptor)
@Controller('accounts')
@ApiTags('Accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly balanceCheckerService: BalanceCheckerService,
    private readonly solpowerCheckerService: SolPowerCheckerService,
  ) {}

  @Get(':address/balance')
  @CacheTTL(BALANCE_CACHE_TTL)
  @ApiOkResponse({
    description: 'Return account SOL balance',
    type: GetBalanceDto,
  })
  @ApiNotFoundResponse({ status: 404, description: 'Not found' })
  async getBalance(@Param('address') address: string): Promise<GetBalanceDto> {
    const balance = await this.balanceCheckerService.getBalance(address);
    return { balance };
  }

  @Get(':address/solPower')
  @CacheTTL(SOLPOWER_CACHE_TTL)
  @ApiOkResponse({
    description: 'Return account SolPower',
    type: GetSolPowerDto,
  })
  async getSolPower(
    @Param('address') address: string,
  ): Promise<GetSolPowerDto> {
    try {
      const solPower = await this.solpowerCheckerService.getSolPower(address);
      return { solPower };
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
