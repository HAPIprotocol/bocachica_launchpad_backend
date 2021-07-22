import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { Client } from 'pg';
import { Connection, EntityTarget, getConnection } from 'typeorm';

export class TestDatabase {
  private dbName: string;
  private con: Connection;

  constructor(private connectionString: string) {
    this.dbName = `dbtest${Math.floor(
      Math.random() * Number.MAX_SAFE_INTEGER,
    ).toString(36)}`;
  }

  pg() {
    return new Client({
      connectionString: `${this.connectionString}/postgres`,
    });
  }

  connection() {
    if (!this.con) {
      this.con = getConnection(this.dbName);
    }
    return this.con;
  }

  repo<T>(entityClass: EntityTarget<T>) {
    return this.connection().getRepository(entityClass);
  }

  async module() {
    try {
      return TypeOrmModule.forRootAsync({
        useFactory: async () => {
          await this.createDatabase();
          return {
            type: 'postgres',
            name: this.dbName,
            url: `${this.connectionString}/${this.dbName}`,
            synchronize: true,
            keepConnectionAlive: true,
            autoLoadEntities: true,
            entities: [join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
            migrations: [
              join(__dirname, '..', 'src', 'migrations', '*.{ts,js}'),
            ],
          };
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private async createDatabase() {
    try {
      const client = this.pg();
      await client.connect();
      await client.query(`CREATE DATABASE ${this.dbName}`);
      await client.end();
    } catch (error) {
      throw new Error(`Unable to create test database: ${error}`);
    }
  }

  async close() {
    try {
      if (this.con) {
        await this.con.close();
      }

      const client = this.pg();
      await client.connect();
      await client.query(`DROP DATABASE ${this.dbName} WITH (FORCE)`);
      await client.end();
    } catch (error) {
      throw new Error(`Unable to teardown test database: ${error}`);
    }
  }
}
