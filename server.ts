import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";
import { apiRouter } from "./server/api";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security and Performance Middleware
  // app.use(helmet({
  //   contentSecurityPolicy: false, 
  //   crossOriginEmbedderPolicy: false,
  // }));
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increased limit for large payloads

  // API Routes
  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
