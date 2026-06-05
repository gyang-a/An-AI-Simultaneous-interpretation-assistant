import { WebSocketServer } from 'ws';
import { getMockSubtitleEvents } from '../mocks/subtitleEvents.js';

const SUBTITLE_SOCKET_PATH = '/ws/subtitles';
const SOCKET_CONTROL_TYPES = {
  AUDIO_START: 'audio:start',
  AUDIO_STOP: 'audio:stop'
};

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
    const audioSession = {
      chunkCount: 0,
      mimeType: ''
    };

    const timers = getMockSubtitleEvents().map((event) =>
      setTimeout(() => {
        sendJson(socket, event);
      }, event.offsetMs)
    );

    socket.on('message', (message, isBinary) => {
      if (isBinary) {
        audioSession.chunkCount += 1;
        return;
      }

      try {
        const payload = JSON.parse(message.toString());

        if (payload.type === SOCKET_CONTROL_TYPES.AUDIO_START) {
          audioSession.mimeType = payload.payload?.mimeType ?? '';
        }

        if (payload.type === SOCKET_CONTROL_TYPES.AUDIO_STOP) {
          audioSession.mimeType = '';
        }
      } catch (error) {
        sendJson(socket, {
          type: 'error',
          message: 'Invalid socket message'
        });
      }
    });

    socket.on('close', () => {
      timers.forEach((timerId) => clearTimeout(timerId));
    });
  });

  return subtitleSocketServer;
}

export { SUBTITLE_SOCKET_PATH };
