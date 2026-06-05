import { WebSocketServer } from 'ws';
import { getMockSubtitleEvents } from '../mocks/subtitleEvents.js';

const SUBTITLE_SOCKET_PATH = '/ws/subtitles';

function sendJson(socket, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

export function attachSubtitleSocket(server) {
  const subtitleSocketServer = new WebSocketServer({
    server,
    path: SUBTITLE_SOCKET_PATH
  });

  subtitleSocketServer.on('connection', (socket) => {
    const timers = getMockSubtitleEvents().map((event) =>
      setTimeout(() => {
        sendJson(socket, event);
      }, event.offsetMs)
    );

    socket.on('close', () => {
      timers.forEach((timerId) => clearTimeout(timerId));
    });
  });

  return subtitleSocketServer;
}

export { SUBTITLE_SOCKET_PATH };
