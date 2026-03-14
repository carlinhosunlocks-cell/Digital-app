import express from "express";
import { docClient, S3_BUCKET_NAME, s3Client } from "./aws";
import { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import crypto from "crypto";

export const apiRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- MOCK DATA FALLBACK FOR PREVIEW ENVIRONMENT ---
// Since we don't have real AWS credentials in the preview, we will use an in-memory store
// if the AWS calls fail, so the app doesn't crash completely.
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

// Helper to handle DynamoDB vs Mock
function isAwsConfigured() {
  const key = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secret = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  
  const isPlaceholder = (val?: string) => 
    !val || 
    val === '' || 
    val === 'mock-key' || 
    val === 'mock-secret' || 
    val === 'undefined' || 
    val === 'null' ||
    val.startsWith('YOUR_');

  return !!(key && !isPlaceholder(key) && secret && !isPlaceholder(secret));
}

async function scanTable(tableName: string) {
  try {
    if (isAwsConfigured()) {
      let items: any[] = [];
      let lastEvaluatedKey: any = undefined;
      
      do {
        const data = await docClient.send(new ScanCommand({ 
          TableName: tableName,
          ExclusiveStartKey: lastEvaluatedKey
        }));
        if (data.Items) {
          items = items.concat(data.Items);
        }
        lastEvaluatedKey = data.LastEvaluatedKey;
      } while (lastEvaluatedKey);
      
      return items;
    }
    return mockDb[tableName] || [];
  } catch (err: any) {
    if (err.name === 'InvalidSignatureException') {
      console.warn(`AWS Credentials for DynamoDB (${tableName}) are invalid. Falling back to mock data.`);
    } else if (err.name === 'ResourceNotFoundException') {
      console.warn(`DynamoDB Table '${tableName}' does not exist in your AWS account. Falling back to mock data.`);
    } else {
      console.warn(`DynamoDB Scan failed for ${tableName}, falling back to mock.`, err);
    }
    return mockDb[tableName] || [];
  }
}

async function putItem(tableName: string, item: any) {
  try {
    if (isAwsConfigured()) {
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      return item;
    }
    if (!mockDb[tableName]) mockDb[tableName] = [];
    const existingIndex = mockDb[tableName].findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      mockDb[tableName][existingIndex] = item;
    } else {
      mockDb[tableName].push(item);
    }
    return item;
  } catch (err: any) {
    if (err.name === 'InvalidSignatureException') {
      console.warn(`AWS Credentials for DynamoDB (${tableName}) are invalid. Falling back to mock data.`);
    } else if (err.name === 'ResourceNotFoundException') {
      console.warn(`DynamoDB Table '${tableName}' does not exist in your AWS account. Falling back to mock data.`);
    } else {
      console.warn(`DynamoDB Put failed for ${tableName}, falling back to mock.`, err);
    }
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
    if (isAwsConfigured()) {
      // Upload to S3
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
    } else {
      // Mock upload
      const mockUrl = `https://picsum.photos/seed/${Date.now()}/200/200`;
      res.json({ url: mockUrl });
    }
  } catch (error: any) {
    if (error.name === 'InvalidSignatureException') {
      console.warn('AWS Credentials for S3 are invalid. Falling back to mock logo.');
      return res.json({ url: `https://picsum.photos/seed/${Date.now()}/200/200` });
    }
    console.error("S3 Upload Error:", error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Global Error Handler for API
apiRouter.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});
