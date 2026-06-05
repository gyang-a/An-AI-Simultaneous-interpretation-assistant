import './SubtitlePanel.less';

function SubtitlePanel({ items, isListening }) {
  const hasItems = items.length > 0;

  return (
    <section className="subtitle-panel" aria-labelledby="subtitle-title">
      <div className="subtitle-header">
        <div className="subtitle-tabs" aria-label="字幕视图">
          <button className="subtitle-tab active" type="button" id="subtitle-title">
            实时字幕
          </button>
          <button className="subtitle-tab" type="button">
            翻译记录
          </button>
        </div>

        <div className="auto-revision">
          <span>AI自动修正</span>
          <span className="toggle-on" aria-hidden="true">
            <i />
          </span>
        </div>
      </div>

      {hasItems ? (
        <ol className="subtitle-list">
          {items.map((item, index) => (
            <li
              className={index === items.length - 1 ? 'subtitle-item active' : 'subtitle-item'}
              key={item.id}
            >
              <time>{item.time}</time>
              <div className="subtitle-copy">
                <p>{item.source}</p>
                <strong>{item.translation}</strong>
              </div>
              <span className="subtitle-status">{item.status}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="subtitle-empty">
          {isListening ? '正在等待第一条字幕...' : '点击开始监听后，实时字幕会显示在这里。'}
        </div>
      )}

      <button className="show-more" type="button">
        显示更多
      </button>
    </section>
  );
}

export default SubtitlePanel;
