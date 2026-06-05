import EmptyStage from './components/EmptyStage.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';

function App() {
  return (
    <main className="app-shell">
      <Sidebar />

      <section className="workspace" aria-labelledby="page-title">
        <Topbar />
        <EmptyStage />
      </section>
    </main>
  );
}

export default App;
