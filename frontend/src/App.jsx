import { useRef, useState } from 'react';
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
  const playbackTimersRef = useRef([]);

  const clearPlaybackTimers = () => {
    playbackTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    playbackTimersRef.current = [];
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
    setSubtitleItems([]);
    setIsListening(true);

    const events = getMockSubtitleEvents();
    playbackTimersRef.current = events.map((event) =>
      window.setTimeout(() => {
        applySubtitleEvent(event);
      }, event.offsetMs)
    );

    const lastEvent = events.at(-1);
    if (lastEvent) {
      const stopTimerId = window.setTimeout(() => {
        setIsListening(false);
        clearPlaybackTimers();
      }, lastEvent.offsetMs + 700);

      playbackTimersRef.current.push(stopTimerId);
    }
  };

  const handleStopListening = () => {
    clearPlaybackTimers();
    setIsListening(false);
  };

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
            <RealtimeStatusPanel />
            <QuickActionsPanel />
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
