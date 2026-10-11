import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

const currentEnv = resolve(process.cwd(), '.env');
const parentEnv = resolve(process.cwd(), '..', '.env');

if (existsSync(currentEnv)) {
  dotenv.config({ path: currentEnv });
}

if (existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  aiApiKey: process.env.AI_API_KEY ?? '',
  aiProvider: process.env.AI_PROVIDER ?? 'local',
};
