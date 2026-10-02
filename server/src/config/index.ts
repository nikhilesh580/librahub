import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// In production, JWT secrets MUST be set via environment variables — never use fallbacks
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProduction && fallback) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProduction,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-fallback-secret'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-fallback-refresh-secret'),
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },

  database: {
    url: process.env.DATABASE_URL,
  },
};

