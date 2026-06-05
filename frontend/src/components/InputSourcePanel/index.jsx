import './InputSourcePanel.less';

const sources = [
  {
    id: 'system',
    icon: 'SYS',
    title: '系统音频',
    description: '监听电脑播放的声音'
  },
  {
    id: 'microphone',
    icon: 'MIC',
    title: '麦克风',
    description: '监听麦克风输入的声音',
    active: true
  },
  {
    id: 'mixed',
    icon: 'MIX',
    title: '混合监听',
    description: '同时监听系统音频和麦克风'
  }
];

function InputSourcePanel() {
  return (
    <aside className="input-source-panel" aria-labelledby="input-source-title">
      <div className="side-panel-header">
        <h2 id="input-source-title">输入源</h2>
      </div>

      <div className="source-list">
        {sources.map((source) => (
          <button
            className={source.active ? 'source-option active' : 'source-option'}
            type="button"
            key={source.id}
          >
            <span className="source-icon" aria-hidden="true">
              {source.icon}
            </span>
            <span className="source-copy">
              <strong>{source.title}</strong>
              <small>{source.description}</small>
            </span>
            {source.active && (
              <span className="source-check" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default InputSourcePanel;
