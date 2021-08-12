import { config } from 'dotenv';
import { from } from 'env-var';

config();
const env = from(process.env, {});

export const PROCESS_RESPAWN_INTERVAL = env
  .get('PROCESS_RESPAWN_INTERVAL')
  .default(5000)
  .asIntPositive();

export const DB_TYPE = env
  .get('DB_TYPE')
  .required(true)
  .default('postgres')
  .asEnum(['postgres']);

export const DB_HOST = env
  .get('DB_HOST')
  .required(true)
  .default('localhost')
  .asString();

export const DB_PORT = env
  .get('DB_PORT')
  .required(true)
  .default(5432)
  .asPortNumber();

export const DB_USERNAME = env
  .get('DB_USERNAME')
  .required(true)
  .default('bocachica')
  .asString();

export const DB_PASSWORD = env
  .get('DB_PASSWORD')
  .required(true)
  .default('bocachica')
  .asString();

export const DB_DATABASE = env
  .get('DB_DATABASE')
  .required(true)
  .default('bocachica')
  .asString();

export const DEFAULT_ITEMS_PER_PAGE = env
  .get('DEFAULT_ITEMS_PER_PAGE')
  .required(true)
  .default('25')
  .asIntPositive();

export const CORS_ORIGINS = env.get('CORS_ORIGINS').default('').asArray();

export const APP_PORT = env.get('APP_PORT').default(3001).asPortNumber();

export const MAX_APP_PROCESSES = env.get('MAX_APP_PROCESSES').asIntPositive();

export const QUEUE_REDIS_URL = env
  .get('QUEUE_REDIS_URL')
  .required(true)
  .default('redis://localhost:6379')
  .asString();

export const BALANCE_CHECKER_JOB_CONCURRENCY = env
  .get('BALANCE_CHECKER_JOB_CONCURRENCY')
  .default(10)
  .asIntPositive();

export const TOTAL_SUPPLY_CHECKER_JOB_CONCURRENCY = env
  .get('TOTAL_SUPPLY_CHECKER_JOB_CONCURRENCY')
  .default(1)
  .asIntPositive();

export const SOLANA_ENDPOINT_URL = env
  .get('SOLANA_ENDPOINT_URL')
  .default('https://api.mainnet-beta.solana.com')
  .asString();

export const SOLPOWER_CHECKER_JOB_CONCURRENCY = env
  .get('SOLPOWER_CHECKER_JOB_CONCURRENCY')
  .default(1)
  .asIntPositive();

export const SOLANABEACH_API_URL = env
  .get('SOLANABEACH_API_URL')
  .default('https://api.solanabeach.io/v1/')
  .required()
  .asString();

export const SOLANABEACH_API_KEY = env
  .get('SOLANABEACH_API_KEY')
  .required()
  .asString();
