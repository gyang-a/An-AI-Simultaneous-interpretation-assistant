import ListeningPanel from './components/ListeningPanel';
import Sidebar from './components/Sidebar';
import SubtitlePanel from './components/SubtitlePanel';
import Topbar from './components/Topbar';

function App() {
  return (
    <main className="app-shell">
      <Sidebar />

      <section className="workspace" aria-labelledby="page-title">
        <Topbar />
        <ListeningPanel />
        <SubtitlePanel />
      </section>
    </main>
  );
}

export default App;
