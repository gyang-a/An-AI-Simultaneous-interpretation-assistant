const DEFAULT_SUBTITLE_SOCKET_PATH = '/ws/subtitles';

const SOCKET_CONTROL_TYPES = {
  AUDIO_START: 'audio:start',
  AUDIO_STOP: 'audio:stop'
};

function getSubtitleSocketUrl() {
  const { protocol, host } = window.location;
  const socketProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

  return `${socketProtocol}//${host}${DEFAULT_SUBTITLE_SOCKET_PATH}`;
}

function parseSubtitleEvent(message) {
  const event = JSON.parse(message.data);

  if (!event.type || !event.segmentId || !event.sourceText) {
    throw new Error('Invalid subtitle event payload');
  }

  return event;
}

function sendJson(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

export function createSubtitleSocket({ onSubtitleEvent, onOpen, onClose, onError }) {
  const socket = new WebSocket(getSubtitleSocketUrl());

  socket.addEventListener('open', () => {
    onOpen?.();
  });

  socket.addEventListener('message', (message) => {
    try {
      onSubtitleEvent(parseSubtitleEvent(message));
    } catch (error) {
      onError?.(error);
    }
  });

  socket.addEventListener('close', () => {
    onClose?.();
  });

  socket.addEventListener('error', (event) => {
    onError?.(event);
  });

  return {
    close() {
      socket.close();
    },
    sendAudioStart(metadata) {
      sendJson(socket, {
        type: SOCKET_CONTROL_TYPES.AUDIO_START,
        payload: metadata
      });
    },
    sendAudioStop() {
      sendJson(socket, {
        type: SOCKET_CONTROL_TYPES.AUDIO_STOP
      });
    },
    sendAudioChunk(chunk) {
      if (socket.readyState === WebSocket.OPEN && chunk?.byteLength > 0) {
        socket.send(chunk);
      }
    }
  };
}
