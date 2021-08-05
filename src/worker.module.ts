import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_TYPE,
  DB_USERNAME,
} from './config';
import { AccountsModule } from './accounts/accounts.module';
import { ProjectsModule } from './projects/projects.module';

export function DatabaseConfigFactory() {
  return {
    type: DB_TYPE,
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    autoLoadEntities: true,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: DatabaseConfigFactory }),
    ScheduleModule.forRoot(),
    ProjectsModule,
    AccountsModule,
  ],
})
export class WorkerModule {}
