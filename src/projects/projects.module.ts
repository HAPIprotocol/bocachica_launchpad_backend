import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Web3Module } from '../web3/web3.module';
import { SolanabeachModule } from '../solanabeach/solanabeach.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectPartner } from './entities/project-partner.entity';
import { ProjectRound } from './entities/project-round.entity';
import { ProjectContribution } from './entities/project-contribution.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectPartner,
      ProjectRound,
      ProjectContribution,
    ]),
    Web3Module,
    SolanabeachModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
