import { ConnectionOptions } from 'typeorm';

const config: ConnectionOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'bocachica',
  password: 'bocachica',
  database: 'bocachica',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*.ts'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};

export default config;
