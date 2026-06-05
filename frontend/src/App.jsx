import { useEffect, useRef, useState } from 'react';
import InputSourcePanel from './components/InputSourcePanel';
import ListeningPanel from './components/ListeningPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import RealtimeStatusPanel from './components/RealtimeStatusPanel';
import Sidebar from './components/Sidebar';
import SubtitlePanel from './components/SubtitlePanel';
import Topbar from './components/Topbar';
import { createSubtitleSocket } from './services/subtitleSocket';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [subtitleItems, setSubtitleItems] = useState([]);
  const [playbackOffsetMs, setPlaybackOffsetMs] = useState(0);
  const playbackStartedAtRef = useRef(0);
  const statusTimerRef = useRef(null);
  const subtitleSocketRef = useRef(null);

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

  const applySubtitleEvent = (event) => {
    if (Number.isFinite(event.offsetMs)) {
      setPlaybackOffsetMs(event.offsetMs);
    }

    setSubtitleItems((currentItems) => {
      const nextItem = {
        id: event.segmentId,
        time: event.time,
        source: event.sourceText,
        translation: event.translatedText,
        status: event.status,
        type: event.type,
        revisionReason: event.revisionReason
      };

      const itemIndex = currentItems.findIndex((item) => item.id === event.segmentId);

      if (itemIndex === -1) {
        return [...currentItems, nextItem];
      }

      return currentItems.map((item, index) => (index === itemIndex ? nextItem : item));
    });
  };

  const handleStartListening = () => {
    closeSubtitleSocket();
    clearStatusTimer();
    setSubtitleItems([]);
    setPlaybackOffsetMs(0);
    setIsListening(true);
    playbackStartedAtRef.current = window.performance.now();

    statusTimerRef.current = window.setInterval(() => {
      setPlaybackOffsetMs(window.performance.now() - playbackStartedAtRef.current);
    }, 500);

    subtitleSocketRef.current = createSubtitleSocket({
      onSubtitleEvent: applySubtitleEvent,
      onClose: () => {
        subtitleSocketRef.current = null;
        clearStatusTimer();
        setIsListening(false);
      },
      onError: () => {
        clearStatusTimer();
        setIsListening(false);
      }
    });
  };

  const handleStopListening = () => {
    closeSubtitleSocket();
    clearStatusTimer();
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
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
