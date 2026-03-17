import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Vercel Postgres and many managed databases provide a connection string
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Configure the pool. If a connection string is provided, use it.
// Otherwise, it falls back to standard PG* environment variables.
export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        // Require SSL for remote connections (like AWS Aurora / Vercel)
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      }
    : {
        // If using individual PGHOST, PGUSER, etc.
        ssl: process.env.PGHOST && !process.env.PGHOST.includes('localhost') ? { rejectUnauthorized: false } : false,
      }
);

// Initialize the database schema (NoSQL-like JSONB store)
export async function initDb() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          collection_name VARCHAR(255) NOT NULL,
          id VARCHAR(255) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (collection_name, id)
        );
      `);
      console.log('✅ PostgreSQL database initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL database (using mock fallback):', err);
  }
}
