import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// The Pool will automatically use standard PostgreSQL environment variables:
// PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
export const pool = new Pool();

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
