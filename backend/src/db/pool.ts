import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 3306),
  user:     process.env.DB_USER     ?? 'admin',
  password: process.env.DB_PASSWORD ?? 'secret',
  database: process.env.DB_NAME     ?? 'gameservers',
  waitForConnections: true,  // queue queries if all connections are busy
  connectionLimit:    10,    // max 10 open connections at once
  queueLimit:         0,     // unlimited queue (0 = no limit)
});