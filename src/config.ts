import { config } from 'dotenv';
import { from } from 'env-var';

config();
const env = from(process.env, {});

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

export const CORS_ORIGINS = env
  .get('CORS_ORIGINS')
  .default('http://localhost:3000')
  .asArray();
