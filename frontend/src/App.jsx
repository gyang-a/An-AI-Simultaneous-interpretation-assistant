import { useEffect, useRef } from 'react';
import InputSourcePanel from './components/InputSourcePanel';
import ListeningPanel from './components/ListeningPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import RealtimeStatusPanel from './components/RealtimeStatusPanel';
import Sidebar from './components/Sidebar';
import SubtitlePanel from './components/SubtitlePanel';
import Topbar from './components/Topbar';
import { createMicrophoneCapture } from './services/microphoneCapture';
import { createSubtitleSocket } from './services/subtitleSocket';
import { useListeningStore } from './stores/listeningStore';

function App() {
  const isListening = useListeningStore((state) => state.isListening);
  const subtitleItems = useListeningStore((state) => state.subtitleItems);
  const playbackOffsetMs = useListeningStore((state) => state.playbackOffsetMs);
  const setIsListening = useListeningStore((state) => state.setIsListening);
  const resetListeningSession = useListeningStore((state) => state.resetListeningSession);
  const setPlaybackOffsetMs = useListeningStore((state) => state.setPlaybackOffsetMs);
  const applySubtitleEvent = useListeningStore((state) => state.applySubtitleEvent);
  const playbackStartedAtRef = useRef(0);
  const statusTimerRef = useRef(null);
  const subtitleSocketRef = useRef(null);
  const microphoneCaptureRef = useRef(null);

  const clearStatusTimer = () => {
    if (statusTimerRef.current) {
      window.clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  };

  const closeSubtitleSocket = () => {
    if (subtitleSocketRef.current) {
      subtitleSocketRef.current.close();
      subtitleSocketRef.current = null;
    }
  };

  const stopMicrophoneCapture = () => {
    if (microphoneCaptureRef.current) {
      microphoneCaptureRef.current.stop();
      microphoneCaptureRef.current = null;
    }
  };

  const handleStartListening = async () => {
    stopMicrophoneCapture();
    closeSubtitleSocket();
    clearStatusTimer();
    resetListeningSession();

    subtitleSocketRef.current = createSubtitleSocket({
      onSubtitleEvent: applySubtitleEvent,
      onOpen: () => {
        if (microphoneCaptureRef.current) {
          subtitleSocketRef.current?.sendAudioStart({
            mimeType: microphoneCaptureRef.current.mimeType,
            sampleRate: microphoneCaptureRef.current.sampleRate,
            encoding: microphoneCaptureRef.current.encoding
          });
        }
      },
      onClose: () => {
        subtitleSocketRef.current = null;
        stopMicrophoneCapture();
        clearStatusTimer();
        setIsListening(false);
      },
      onError: () => {
        stopMicrophoneCapture();
        clearStatusTimer();
        setIsListening(false);
      }
    });

    try {
      microphoneCaptureRef.current = await createMicrophoneCapture({
        onAudioChunk: (chunk) => {
          subtitleSocketRef.current?.sendAudioChunk(chunk);
        },
        onError: () => {
          stopMicrophoneCapture();
          closeSubtitleSocket();
          clearStatusTimer();
          setIsListening(false);
        }
      });

      subtitleSocketRef.current?.sendAudioStart({
        mimeType: microphoneCaptureRef.current.mimeType,
        sampleRate: microphoneCaptureRef.current.sampleRate,
        encoding: microphoneCaptureRef.current.encoding
      });

      setIsListening(true);
      playbackStartedAtRef.current = window.performance.now();

      statusTimerRef.current = window.setInterval(() => {
        setPlaybackOffsetMs(window.performance.now() - playbackStartedAtRef.current);
      }, 500);
    } catch (error) {
      stopMicrophoneCapture();
      closeSubtitleSocket();
      clearStatusTimer();
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    subtitleSocketRef.current?.sendAudioStop();
    stopMicrophoneCapture();
    closeSubtitleSocket();
    clearStatusTimer();
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopMicrophoneCapture();
      closeSubtitleSocket();
      clearStatusTimer();
    };
  }, []);

  return (
    <main className="app-shell">
      <Sidebar />

      <section className="workspace" aria-labelledby="page-title">
        <Topbar />
        <div className="workspace-grid">
          <div className="main-column">
            <ListeningPanel
              isListening={isListening}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
            />
            <SubtitlePanel items={subtitleItems} isListening={isListening} />
          </div>
          <div className="side-column">
            <InputSourcePanel />
            <RealtimeStatusPanel
              isListening={isListening}
              playbackOffsetMs={playbackOffsetMs}
            />
            <QuickActionsPanel />
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
