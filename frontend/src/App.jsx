import { useEffect, useRef, useState } from 'react';
import AuthPage from './components/AuthPage';
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
import {
  clearTranslationHistoryRecords,
  fetchTranslationHistory,
  saveTranslationHistoryRecord
} from './services/translationHistoryApi';
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession
} from './services/authStorage';
import { logoutAuthUser } from './services/authApi';
import { createSubtitleSocket } from './services/subtitleSocket';
import { useListeningStore } from './stores/listeningStore';

function App() {
  const [authSession, setAuthSession] = useState(readAuthSession);
  const [selectedInputSource, setSelectedInputSource] = useState('microphone');
  const isListening = useListeningStore((state) => state.isListening);
  const subtitleItems = useListeningStore((state) => state.subtitleItems);
  const translationHistory = useListeningStore((state) => state.translationHistory);
  const playbackOffsetMs = useListeningStore((state) => state.playbackOffsetMs);
  const setIsListening = useListeningStore((state) => state.setIsListening);
  const resetListeningSession = useListeningStore((state) => state.resetListeningSession);
  const clearSubtitleItems = useListeningStore((state) => state.clearSubtitleItems);
  const clearTranslationHistory = useListeningStore((state) => state.clearTranslationHistory);
  const setTranslationHistory = useListeningStore((state) => state.setTranslationHistory);
  const archiveCurrentSession = useListeningStore((state) => state.archiveCurrentSession);
  const setPlaybackOffsetMs = useListeningStore((state) => state.setPlaybackOffsetMs);
  const applySubtitleEvent = useListeningStore((state) => state.applySubtitleEvent);
  const playbackStartedAtRef = useRef(0);
  const statusTimerRef = useRef(null);
  const subtitleSocketRef = useRef(null);
  const audioCaptureRef = useRef(null);

  const handleAuthenticated = (session) => {
    saveAuthSession(session);
    setAuthSession(session);
  };

  const persistCurrentSession = async () => {
    const historyItem = archiveCurrentSession();

    if (!historyItem) {
      return;
    }

    try {
      await saveTranslationHistoryRecord(historyItem);
    } catch (error) {
      // 记录保存失败不影响实时监听流程，用户仍能继续使用当前字幕。
    }
  };

  const handleClearTranslationHistory = async () => {
    clearTranslationHistory();

    try {
      await clearTranslationHistoryRecords();
    } catch (error) {
      // 清空失败时保持前端已清空状态，下一次登录后会重新以数据库为准。
    }
  };

  const handleLogout = async () => {
    stopAudioCapture();
    closeSubtitleSocket();
    clearStatusTimer();
    setIsListening(false);

    try {
      await logoutAuthUser();
    } catch (error) {
      // 即使后端 Cookie 清理失败，也要允许用户清掉本地 AT 回到登录页。
    }

    clearAuthSession();
    setAuthSession(null);
  };

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
    await persistCurrentSession();
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

  const handleStopListening = async () => {
    subtitleSocketRef.current?.sendAudioStop();
    await persistCurrentSession();
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

  useEffect(() => {
    if (!authSession) {
      setTranslationHistory([]);
      return;
    }

    let isActive = true;

    fetchTranslationHistory()
      .then((historyItems) => {
        if (isActive) {
          setTranslationHistory(historyItems);
        }
      })
      .catch(() => {
        if (isActive) {
          setTranslationHistory([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authSession, setTranslationHistory]);

  if (!authSession) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main className="app-shell">
      <Sidebar onLogout={handleLogout} />

      <section className="workspace" aria-labelledby="page-title">
        <Topbar />
        <div className="workspace-grid">
          <div className="main-column">
            <ListeningPanel
              isListening={isListening}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
            />
            <SubtitlePanel
              items={subtitleItems}
              isListening={isListening}
              historyItems={translationHistory}
              onClearHistory={handleClearTranslationHistory}
            />
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
