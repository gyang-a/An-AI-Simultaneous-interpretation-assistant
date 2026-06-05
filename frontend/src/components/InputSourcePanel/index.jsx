import './InputSourcePanel.less';

const sources = [
  {
    id: 'system',
    icon: '▣',
    title: '系统音频',
    description: '监听电脑播放的声音（推荐）',
    active: true
  },
  {
    id: 'microphone',
    icon: '🎙',
    title: '麦克风',
    description: '监听麦克风输入的声音'
  },
  {
    id: 'mixed',
    icon: '⌘',
    title: '混合监听',
    description: '同时监听系统音频和麦克风'
  }
];

function InputSourcePanel() {
  return (
    <aside className="input-source-panel" aria-labelledby="input-source-title">
      <div className="side-panel-header">
        <h2 id="input-source-title">输入源</h2>
        <span aria-hidden="true">?</span>
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

      <div className="sensitivity-row">
        <span>拾音灵敏度</span>
        <strong>70%</strong>
      </div>
      <div className="sensitivity-track" aria-hidden="true">
        <span />
        <i />
      </div>
    </aside>
  );
}

export default InputSourcePanel;
