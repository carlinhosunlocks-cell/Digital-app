import express from "express";
import { pool } from "./db";
import multer from "multer";
import crypto from "crypto";
import { S3_BUCKET_NAME, s3Client } from "./aws";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const apiRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to handle PostgreSQL vs Mock (if DB is not configured)
const mockDb: Record<string, any[]> = {
  users: [],
  orders: [],
  tickets: [],
  hrRequests: [],
  reports: [],
  timeRecords: [],
  inventory: [],
  technicianStock: [],
  auditLogs: [],
  notifications: [],
  invoices: [],
  settings: []
};

async function scanTable(tableName: string) {
  try {
    const result = await pool.query(
      'SELECT data FROM documents WHERE collection_name = $1',
      [tableName]
    );
    return result.rows.map(row => row.data);
  } catch (err) {
    console.error(`PostgreSQL Scan failed for ${tableName}, falling back to mock.`, err);
    return mockDb[tableName] || [];
  }
}

async function putItem(tableName: string, item: any) {
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
    console.error(`PostgreSQL Put failed for ${tableName}, falling back to mock.`, err);
    
    if (!mockDb[tableName]) mockDb[tableName] = [];
    const existingIndex = mockDb[tableName].findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      mockDb[tableName][existingIndex] = item;
    } else {
      mockDb[tableName].push(item);
    }
    return item;
  }
}

// --- USERS ---
apiRouter.get('/users', async (req, res) => {
  const users = await scanTable('users');
  res.json(users);
});

apiRouter.post('/users', async (req, res) => {
  const user = { ...req.body, id: req.body.id || crypto.randomUUID() };
  await putItem('users', user);
  res.json(user);
});

// --- ORDERS ---
apiRouter.get('/orders', async (req, res) => {
  const orders = await scanTable('orders');
  res.json(orders);
});

apiRouter.post('/orders', async (req, res) => {
  const order = { ...req.body, id: req.body.id || crypto.randomUUID() };
  await putItem('orders', order);
  res.json(order);
});

// --- TICKETS ---
apiRouter.get('/tickets', async (req, res) => {
  const tickets = await scanTable('tickets');
  res.json(tickets);
});

apiRouter.post('/tickets', async (req, res) => {
  const ticket = { ...req.body, id: req.body.id || crypto.randomUUID() };
  await putItem('tickets', ticket);
  res.json(ticket);
});

// --- GENERIC GET/POST FOR OTHER COLLECTIONS ---
const collections = ['hrRequests', 'reports', 'timeRecords', 'inventory', 'technicianStock', 'auditLogs', 'notifications', 'invoices', 'settings'];

collections.forEach(collection => {
  apiRouter.get(`/${collection}`, async (req, res) => {
    const items = await scanTable(collection);
    res.json(items);
  });

  apiRouter.post(`/${collection}`, async (req, res) => {
    const item = { ...req.body, id: req.body.id || crypto.randomUUID() };
    await putItem(collection, item);
    res.json(item);
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
