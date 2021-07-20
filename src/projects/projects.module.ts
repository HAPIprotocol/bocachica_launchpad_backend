import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectPartner } from './entities/project-partner.entity';
import { ProjectRound } from './entities/project-round.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectPartner, ProjectRound])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
