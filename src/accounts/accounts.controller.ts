import {
  CacheInterceptor,
  CacheTTL,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AccountsService } from './accounts.service';
import { BalanceCheckerService } from './balance-checker.service';
import { GetBalanceDto } from './dto/get-balance.dto';

const BALANCE_CACHE_TTL = 60;

@UseInterceptors(CacheInterceptor)
@Controller('accounts')
@ApiTags('Accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly balanceCheckerService: BalanceCheckerService,
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
}
