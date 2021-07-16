/* eslint-disable @typescript-eslint/ban-types */
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectType, Repository } from 'typeorm';

export function mockTypeOrmProviders() {
  const providers: Record<string, IMockEntityProvider<unknown>> = {};
  jest
    .spyOn(TypeOrmModule, 'forFeature')
    .mockImplementation((entities: ObjectType<unknown>[]) => {
      for (const entity of entities) {
        providers[entity.name] = mockEntityProvider(entity);
      }
      return {
        module: TypeOrmModule,
        providers: Object.values(providers),
        exports: Object.values(providers),
      };
    });
  return {
    repo: <T>(entity: ObjectType<T>) =>
      providers[entity.name].repo as Repository<T>,
    provider: <T>(entity: ObjectType<T>) => providers[entity.name],
  };
}

export const typeOrmMock = mockTypeOrmProviders();

export interface IMockEntityProvider<T> {
  provide: string;
  useClass: jest.Mock<Repository<T>, []>;
  repo: Repository<T>;
}

export function mockEntityProvider<T>(
  entity: ObjectType<T>,
): IMockEntityProvider<T> {
  const repo = new Repository<T>();
  const token = getRepositoryToken(entity);
  return {
    provide: typeof token === 'function' ? token() : token,
    useClass: jest.fn(() => repo),
    repo,
  };
}
