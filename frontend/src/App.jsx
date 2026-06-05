import { useEffect, useRef, useState } from 'react';
import InputSourcePanel from './components/InputSourcePanel';
import ListeningPanel from './components/ListeningPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import RealtimeStatusPanel from './components/RealtimeStatusPanel';
import Sidebar from './components/Sidebar';
import SubtitlePanel from './components/SubtitlePanel';
import Topbar from './components/Topbar';
import {
  createMicrophoneCapture,
  createSystemAudioCapture
} from './services/microphoneCapture';
import { createSubtitleSocket } from './services/subtitleSocket';
import { useListeningStore } from './stores/listeningStore';

function App() {
  const [selectedInputSource, setSelectedInputSource] = useState('microphone');
  const isListening = useListeningStore((state) => state.isListening);
  const subtitleItems = useListeningStore((state) => state.subtitleItems);
  const playbackOffsetMs = useListeningStore((state) => state.playbackOffsetMs);
  const setIsListening = useListeningStore((state) => state.setIsListening);
  const resetListeningSession = useListeningStore((state) => state.resetListeningSession);
  const clearSubtitleItems = useListeningStore((state) => state.clearSubtitleItems);
  const setPlaybackOffsetMs = useListeningStore((state) => state.setPlaybackOffsetMs);
  const applySubtitleEvent = useListeningStore((state) => state.applySubtitleEvent);
  const playbackStartedAtRef = useRef(0);
  const statusTimerRef = useRef(null);
  const subtitleSocketRef = useRef(null);
  const audioCaptureRef = useRef(null);

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

  const stopAudioCapture = () => {
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }
  };

  const createAudioCapture = (options) => {
    if (selectedInputSource === 'system') {
      return createSystemAudioCapture(options);
    }

    return createMicrophoneCapture(options);
  };

  const handleStartListening = async () => {
    stopAudioCapture();
    closeSubtitleSocket();
    clearStatusTimer();
    resetListeningSession();

    subtitleSocketRef.current = createSubtitleSocket({
      onSubtitleEvent: applySubtitleEvent,
      onOpen: () => {
        if (audioCaptureRef.current) {
          subtitleSocketRef.current?.sendAudioStart({
            mimeType: audioCaptureRef.current.mimeType,
            sampleRate: audioCaptureRef.current.sampleRate,
            encoding: audioCaptureRef.current.encoding
          });
        }
      },
      onClose: () => {
        subtitleSocketRef.current = null;
        stopAudioCapture();
        clearStatusTimer();
        setIsListening(false);
      },
      onError: () => {
        stopAudioCapture();
        clearStatusTimer();
        setIsListening(false);
      }
    });

    try {
      audioCaptureRef.current = await createAudioCapture({
        onAudioChunk: (chunk) => {
          subtitleSocketRef.current?.sendAudioChunk(chunk);
        },
        onError: () => {
          stopAudioCapture();
          closeSubtitleSocket();
          clearStatusTimer();
          setIsListening(false);
        }
      });

      subtitleSocketRef.current?.sendAudioStart({
        mimeType: audioCaptureRef.current.mimeType,
        sampleRate: audioCaptureRef.current.sampleRate,
        encoding: audioCaptureRef.current.encoding
      });

      setIsListening(true);
      playbackStartedAtRef.current = window.performance.now();
      statusTimerRef.current = window.setInterval(() => {
        setPlaybackOffsetMs(window.performance.now() - playbackStartedAtRef.current);
      }, 500);
    } catch (error) {
      stopAudioCapture();
      closeSubtitleSocket();
      clearStatusTimer();
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    subtitleSocketRef.current?.sendAudioStop();
    stopAudioCapture();
    closeSubtitleSocket();
    clearStatusTimer();
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopAudioCapture();
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
            <InputSourcePanel
              disabled={isListening}
              selectedSource={selectedInputSource}
              onSelectSource={setSelectedInputSource}
            />
            <RealtimeStatusPanel
              isListening={isListening}
              playbackOffsetMs={playbackOffsetMs}
              subtitleItems={subtitleItems}
            />
            <QuickActionsPanel
              subtitleItems={subtitleItems}
              onClearSubtitles={clearSubtitleItems}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
