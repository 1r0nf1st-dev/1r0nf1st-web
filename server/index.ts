import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { githubRouter } from './routes/github.js';
import { config } from './config.js';

const app = express();
const PORT = config.port || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/github', githubRouter);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
