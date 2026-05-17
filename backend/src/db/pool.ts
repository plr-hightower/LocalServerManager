import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import mysql from 'mysql2/promise';

console.log("DEBUG ENVIRONMENT CHECK:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER
});

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_EXPOSE_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});