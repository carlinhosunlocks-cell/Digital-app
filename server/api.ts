import express from "express";
import { pool } from "./db";
import multer from "multer";
import crypto from "crypto";
import { S3_BUCKET_NAME, s3Client } from "./aws";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Import mock data for fallback
import { 
  MOCK_USERS, INITIAL_ORDERS, INITIAL_TICKETS, INITIAL_HR_REQUESTS, 
  INITIAL_REPORTS, INITIAL_TIME_RECORDS, INITIAL_INVENTORY, 
  INITIAL_TECH_STOCK, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS, 
  INITIAL_INVOICES 
} from "../src/services/mockStore";

export const apiRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory mock store
const mockStore: Record<string, any[]> = {
  users: [...MOCK_USERS],
  orders: [...INITIAL_ORDERS],
  tickets: [...INITIAL_TICKETS],
  hrRequests: [...INITIAL_HR_REQUESTS],
  reports: [...INITIAL_REPORTS],
  timeRecords: [...INITIAL_TIME_RECORDS],
  inventory: [...INITIAL_INVENTORY],
  technicianStock: [...INITIAL_TECH_STOCK],
  auditLogs: [...INITIAL_AUDIT_LOGS],
  notifications: [...INITIAL_NOTIFICATIONS],
  invoices: [...INITIAL_INVOICES],
  settings: []
};

let dbConnected = true;

// Check connection on startup
pool.query('SELECT 1').catch(() => {
  console.warn('⚠️ PostgreSQL connection failed. Using in-memory mock store.');
  dbConnected = false;
});

async function scanTable(tableName: string) {
  if (!dbConnected) {
    return mockStore[tableName] || [];
  }
  try {
    const result = await pool.query(
      'SELECT data FROM documents WHERE collection_name = $1',
      [tableName]
    );
    return result.rows.map(row => row.data);
  } catch (err) {
    console.warn(`⚠️ PostgreSQL Scan failed for ${tableName}, falling back to mock store.`);
    dbConnected = false;
    return mockStore[tableName] || [];
  }
}

async function putItem(tableName: string, item: any) {
  if (!dbConnected) {
    if (!mockStore[tableName]) mockStore[tableName] = [];
    const index = mockStore[tableName].findIndex((i: any) => i.id === item.id);
    if (index >= 0) {
      mockStore[tableName][index] = item;
    } else {
      mockStore[tableName].push(item);
    }
    return item;
  }
  try {
    await pool.query(
      `INSERT INTO documents (collection_name, id, data, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (collection_name, id) 
       DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
      [tableName, item.id, item]
    );
    return item;
  } catch (err) {
    console.warn(`⚠️ PostgreSQL Put failed for ${tableName}, falling back to mock store.`);
    dbConnected = false;
    if (!mockStore[tableName]) mockStore[tableName] = [];
    const index = mockStore[tableName].findIndex((i: any) => i.id === item.id);
    if (index >= 0) {
      mockStore[tableName][index] = item;
    } else {
      mockStore[tableName].push(item);
    }
    return item;
  }
}

async function getItem(tableName: string, id: string) {
  if (!dbConnected) {
    return (mockStore[tableName] || []).find((i: any) => i.id === id);
  }
  try {
    const result = await pool.query(
      'SELECT data FROM documents WHERE collection_name = $1 AND id = $2',
      [tableName, id]
    );
    if (result.rows.length > 0) {
      return result.rows[0].data;
    }
    return null;
  } catch (err) {
    console.warn(`⚠️ PostgreSQL Get failed for ${tableName}, falling back to mock store.`);
    dbConnected = false;
    return (mockStore[tableName] || []).find((i: any) => i.id === id);
  }
}

async function deleteItem(tableName: string, id: string) {
  if (!dbConnected) {
    if (mockStore[tableName]) {
      mockStore[tableName] = mockStore[tableName].filter((i: any) => i.id !== id);
    }
    return true;
  }
  try {
    await pool.query(
      'DELETE FROM documents WHERE collection_name = $1 AND id = $2',
      [tableName, id]
    );
    return true;
  } catch (err) {
    console.warn(`⚠️ PostgreSQL Delete failed for ${tableName}, falling back to mock store.`);
    dbConnected = false;
    if (mockStore[tableName]) {
      mockStore[tableName] = mockStore[tableName].filter((i: any) => i.id !== id);
    }
    return true;
  }
}

// --- GENERIC GET/POST/DELETE FOR ALL COLLECTIONS ---
const collections = [
  'users', 'orders', 'tickets', 'hrRequests', 'reports', 
  'timeRecords', 'inventory', 'technicianStock', 'auditLogs', 
  'notifications', 'invoices', 'settings'
];

collections.forEach(collection => {
  apiRouter.get(`/${collection}`, async (req, res) => {
    try {
      const items = await scanTable(collection);
      res.json(items);
    } catch (err: any) {
      console.error(`PostgreSQL Scan failed for ${collection}:`, err);
      res.status(500).json({ error: 'Failed to fetch items', message: err.message });
    }
  });

  apiRouter.get(`/${collection}/:id`, async (req, res) => {
    const { id } = req.params;
    try {
      const item = await getItem(collection, id);
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ error: 'Item not found' });
      }
    } catch (err: any) {
      console.error(`PostgreSQL Get by ID failed for ${collection}:`, err);
      res.status(500).json({ error: 'Failed to fetch item', message: err.message });
    }
  });

  apiRouter.post(`/${collection}`, async (req, res) => {
    try {
      const item = { ...req.body, id: req.body.id || crypto.randomUUID() };
      await putItem(collection, item);
      res.json(item);
    } catch (err: any) {
      console.error(`PostgreSQL Put failed for ${collection}:`, err);
      res.status(500).json({ error: 'Failed to save item', message: err.message });
    }
  });

  apiRouter.delete(`/${collection}/:id`, async (req, res) => {
    const { id } = req.params;
    try {
      await deleteItem(collection, id);
      res.json({ success: true, id });
    } catch (err: any) {
      console.error(`PostgreSQL Delete failed for ${collection}:`, err);
      res.status(500).json({ error: 'Failed to delete item', message: err.message });
    }
  });
});

// --- S3 UPLOAD (LOGO) ---
apiRouter.post('/upload-logo', upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileKey = `logos/company-logo-${Date.now()}-${req.file.originalname}`;

  try {
    // Upload to S3 (Credentials automatically resolved via IAM/Environment)
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // Generate presigned URL (or construct public URL if bucket is public)
    const url = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
    }), { expiresIn: 3600 }); // 1 hour

    res.json({ url });
  } catch (error: any) {
    console.warn('AWS S3 Upload failed (using mock fallback):', error.message);
    const mockUrl = `https://picsum.photos/seed/${Date.now()}/200/200`;
    res.json({ url: mockUrl });
  }
});

// Global Error Handler for API
apiRouter.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});
