import ListeningPanel from './components/ListeningPanel';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

function App() {
  return (
    <main className="app-shell">
      <Sidebar />

      <section className="workspace" aria-labelledby="page-title">
        <Topbar />
        <ListeningPanel />
      </section>
    </main>
  );
}

export default App;
