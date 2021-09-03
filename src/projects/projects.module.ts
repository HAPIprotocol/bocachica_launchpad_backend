import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Web3Module } from '../web3/web3.module';
import { SolanabeachModule } from '../solanabeach/solanabeach.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectPartner } from './entities/project-partner.entity';
import { ProjectRound } from './entities/project-round.entity';
import { ProjectContribution } from './entities/project-contribution.entity';
import { ContribCheckerService } from './contrib-checker.service';
import { TicketsModule } from '../tickets/tickets.module';
import { TotalSupplyCheckerService } from './total-supply-checker.service';
import { ProjectParticipant } from './entities/project-participant.entity';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    CacheModule.register({ max: 500 }),
    TypeOrmModule.forFeature([
      Project,
      ProjectPartner,
      ProjectRound,
      ProjectContribution,
      ProjectParticipant,
    ]),
    Web3Module,
    SolanabeachModule,
    TicketsModule,
    AccountsModule,
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ContribCheckerService,
    TotalSupplyCheckerService,
  ],
})
export class ProjectsModule {}
