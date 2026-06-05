const DEFAULT_SUBTITLE_SOCKET_PATH = '/ws/subtitles';

function getSubtitleSocketUrl() {
  const { protocol, host } = window.location;
  const socketProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

  return `${socketProtocol}//${host}${DEFAULT_SUBTITLE_SOCKET_PATH}`;
}

function parseSubtitleEvent(message) {
  const event = JSON.parse(message.data);

  if (!event.type || !event.segmentId) {
    throw new Error('Invalid subtitle event payload');
  }

  return event;
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

  return socket;
}
