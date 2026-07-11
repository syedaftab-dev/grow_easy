import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { importRouter } from './routes/import.route';

// ── Startup environment validation ─────────────────────────────────────────
// Check required vars here, before any service module initialises its client.
// This gives a clear error instead of a cryptic SDK crash.

const REQUIRED_ENV: string[] = ['GROQ_API_KEY'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variable(s): ${missing.join(', ')}\n` +
    `   Copy apps/api/.env.example → apps/api/.env and fill in the values.\n`,
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }),
);

app.use(express.json());

// Routes
app.use('/api', importRouter);

// Root info endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'GrowEasy CRM Importer API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      import: 'POST /api/import',
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`🚀 GrowEasy API running on http://localhost:${PORT}`);
});

export default app;
