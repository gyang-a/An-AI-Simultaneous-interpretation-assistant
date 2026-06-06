import './InputSourcePanel.less';

const sources = [
  {
    id: 'system',
    icon: 'SYS',
    title: '系统音频',
    description: '监听电脑或浏览器标签页播放的声音'
  },
  {
    id: 'microphone',
    icon: 'MIC',
    title: '麦克风',
    description: '监听麦克风输入的声音'
  }
];

function InputSourcePanel({ disabled, selectedSource, onSelectSource }) {
  return (
    <aside className="input-source-panel" aria-labelledby="input-source-title">
      <div className="side-panel-header">
        <h2 id="input-source-title">输入源</h2>
      </div>

      <div className="source-list">
        {sources.map((source) => {
          const isActive = source.id === selectedSource;
          const isDisabled = disabled || source.disabled;

          return (
            <button
              className={isActive ? 'source-option active' : 'source-option'}
              disabled={isDisabled}
              type="button"
              key={source.id}
              onClick={() => onSelectSource(source.id)}
            >
              <span className="source-icon" aria-hidden="true">
                {source.icon}
              </span>
              <span className="source-copy">
                <strong>{source.title}</strong>
                <small>{source.description}</small>
              </span>
              {isActive && (
                <span className="source-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default InputSourcePanel;
