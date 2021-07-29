import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectPartner } from './entities/project-partner.entity';
import { ProjectRound } from './entities/project-round.entity';
import { Web3Module } from 'src/web3/web3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectPartner, ProjectRound]),
    Web3Module,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
