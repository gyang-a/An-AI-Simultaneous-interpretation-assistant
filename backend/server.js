import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import healthRoutes from './routes/healthRoutes.js';
import { attachSubtitleSocket, SUBTITLE_SOCKET_PATH } from './websocket/subtitleSocket.js';

const app = express();
const port = process.env.PORT || 3001;
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api', healthRoutes);

attachSubtitleSocket(server);

server.listen(port, () => {
  console.log(`Backend service is running at http://localhost:${port}`);
  console.log(`Subtitle WebSocket is ready at ws://localhost:${port}${SUBTITLE_SOCKET_PATH}`);
});
