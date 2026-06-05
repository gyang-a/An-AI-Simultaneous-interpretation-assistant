import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-simultaneous-interpretation-assistant',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Backend service is running at http://localhost:${port}`);
});
