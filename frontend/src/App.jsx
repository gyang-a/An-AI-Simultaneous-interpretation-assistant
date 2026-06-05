import InputSourcePanel from './components/InputSourcePanel';
import ListeningPanel from './components/ListeningPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import RealtimeStatusPanel from './components/RealtimeStatusPanel';
import Sidebar from './components/Sidebar';
import SubtitlePanel from './components/SubtitlePanel';
import Topbar from './components/Topbar';

function App() {
  return (
    <main className="app-shell">
      <Sidebar />

      <section className="workspace" aria-labelledby="page-title">
        <Topbar />
        <div className="workspace-grid">
          <div className="main-column">
            <ListeningPanel />
            <SubtitlePanel />
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
