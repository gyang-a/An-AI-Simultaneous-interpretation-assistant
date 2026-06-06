import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import translationHistoryRoutes from './routes/translationHistoryRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import { attachSubtitleSocket, SUBTITLE_SOCKET_PATH } from './websocket/subtitleSocket.js';

const app = express();
const port = process.env.PORT || 3001;
const server = createServer(app);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '512kb' }));
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', translationHistoryRoutes);
app.use('/api', userProfileRoutes);

attachSubtitleSocket(server);

server.listen(port, () => {
  console.log(`Backend service is running at http://localhost:${port}`);
  console.log(`Subtitle WebSocket is ready at ws://localhost:${port}${SUBTITLE_SOCKET_PATH}`);
});
