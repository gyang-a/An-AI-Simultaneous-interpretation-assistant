const roadmapItems = [
  '实时字幕界面',
  'WebSocket 音频通道',
  '麦克风音频采集',
  'Mock AI 转写与翻译',
  '上下文字幕修正'
];

function App() {
  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="status-strip">
          <span className="status-dot" aria-hidden="true" />
          <span>项目初始化完成</span>
        </div>

        <header className="page-header">
          <div>
            <p className="eyebrow">AI Simultaneous Interpretation Assistant</p>
            <h1 id="page-title">AI 同声传译助手</h1>
            <p className="summary">
              面向演讲、会议和网课场景，后续将支持实时中文翻译字幕与自动修正。
            </p>
          </div>
        </header>

        <section className="panel" aria-labelledby="startup-title">
          <div className="panel-header">
            <div>
              <h2 id="startup-title">启动状态</h2>
              <p>前端 Vite 应用已就绪，后端健康检查接口可用于联调。</p>
            </div>
            <code>PR 1</code>
          </div>

          <div className="health-grid">
            <div className="health-item">
              <span>Frontend</span>
              <strong>http://localhost:5173</strong>
            </div>
            <div className="health-item">
              <span>Backend</span>
              <strong>/api/health</strong>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="roadmap-title">
          <div className="panel-header">
            <div>
              <h2 id="roadmap-title">后续小 PR</h2>
              <p>每次只推进一个可测试的小功能，主分支始终保持可运行。</p>
            </div>
          </div>

          <ol className="roadmap">
            {roadmapItems.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}

export default App;
