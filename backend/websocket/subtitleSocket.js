import { WebSocketServer } from 'ws';
import { createMockAiTranslationSession } from '../providers/mockAiTranslationProvider.js';

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
    const translationSession = createMockAiTranslationSession({
      onSubtitleEvent: (event) => {
        sendJson(socket, event);
      }
    });

    socket.on('message', (message, isBinary) => {
      if (isBinary) {
        translationSession.receiveAudioChunk(message);
        return;
      }

      try {
        const payload = JSON.parse(message.toString());

        if (payload.type === SOCKET_CONTROL_TYPES.AUDIO_START) {
          translationSession.start(payload.payload);
        }

        if (payload.type === SOCKET_CONTROL_TYPES.AUDIO_STOP) {
          translationSession.stop();
        }
      } catch (error) {
        sendJson(socket, {
          type: 'error',
          message: 'Invalid socket message'
        });
      }
    });

    socket.on('close', () => {
      translationSession.stop();
    });
  });

  return subtitleSocketServer;
}

export { SUBTITLE_SOCKET_PATH };
