import { useEffect, useRef, useState } from 'react';
import InputSourcePanel from './components/InputSourcePanel';
import ListeningPanel from './components/ListeningPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import RealtimeStatusPanel from './components/RealtimeStatusPanel';
import Sidebar from './components/Sidebar';
import SubtitlePanel from './components/SubtitlePanel';
import Topbar from './components/Topbar';
import { getMockSubtitleEvents } from './mocks/subtitleEvents';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [subtitleItems, setSubtitleItems] = useState([]);
  const [playbackOffsetMs, setPlaybackOffsetMs] = useState(0);
  const playbackTimersRef = useRef([]);
  const playbackStartedAtRef = useRef(0);
  const statusTimerRef = useRef(null);

  const clearPlaybackTimers = () => {
    playbackTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    playbackTimersRef.current = [];
  };

  const clearStatusTimer = () => {
    if (statusTimerRef.current) {
      window.clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  };

  const applySubtitleEvent = (event) => {
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
    clearPlaybackTimers();
    clearStatusTimer();
    setSubtitleItems([]);
    setPlaybackOffsetMs(0);
    setIsListening(true);
    playbackStartedAtRef.current = window.performance.now();

    statusTimerRef.current = window.setInterval(() => {
      setPlaybackOffsetMs(window.performance.now() - playbackStartedAtRef.current);
    }, 500);

    const events = getMockSubtitleEvents();
    playbackTimersRef.current = events.map((event) =>
      window.setTimeout(() => {
        setPlaybackOffsetMs(event.offsetMs);
        applySubtitleEvent(event);
      }, event.offsetMs)
    );

    const lastEvent = events.at(-1);
    if (lastEvent) {
      const stopTimerId = window.setTimeout(() => {
        setIsListening(false);
        clearPlaybackTimers();
        clearStatusTimer();
        setPlaybackOffsetMs(lastEvent.offsetMs);
      }, lastEvent.offsetMs + 700);

      playbackTimersRef.current.push(stopTimerId);
    }
  };

  const handleStopListening = () => {
    clearPlaybackTimers();
    clearStatusTimer();
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      clearPlaybackTimers();
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
