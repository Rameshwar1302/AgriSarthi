import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/agrisaarthi'),
  JWT_SECRET: z.string().default('agrisaarthi_default_secret_key_hackathon_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  // AI Config
  LLM_PROVIDER: z.string().default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  
  // Mandi / Government Data Config
  DATA_GOV_IN_API_KEY: z.string().optional().default(''),
  AGMARKNET_RESOURCE_ID: z.string().default('9ef84268-d588-465a-a308-a864a43d0070'),
  
  // Providers
  WEATHER_PROVIDER: z.string().default('open-meteo'),
  SOIL_PROVIDER: z.string().default('isric-soilgrids'),
  
  // Demo Resilience Flag
  DEMO_MODE: z.string().transform((val) => val === 'true' || val === '1').default('true'),
});

export const env = envSchema.parse(process.env);

