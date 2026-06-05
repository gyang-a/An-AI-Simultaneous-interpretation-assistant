import './ListeningPanel.less';

function ListeningPanel({ isListening, onStartListening, onStopListening }) {
  return (
    <section className="listening-section" aria-labelledby="listening-title">
      <article className={isListening ? 'listening-card active' : 'listening-card'}>
        <div className="listening-copy">
          <div className="listening-status">
            <span
              className={isListening ? 'status-dot active' : 'status-dot'}
              aria-hidden="true"
            />
            <h2 id="listening-title">
              {isListening ? '正在监听' : '准备监听'}
            </h2>
          </div>
          <p>
            {isListening
              ? '正在实时识别并翻译输入音频。'
              : '选择输入源后开始生成实时双语字幕。'}
          </p>
        </div>

        {isListening ? (
          <button className="stop-button" type="button" onClick={onStopListening}>
            停止监听
          </button>
        ) : (
          <button className="start-button" type="button" onClick={onStartListening}>
            开始监听
          </button>
        )}
      </article>
    </section>
  );
}

export default ListeningPanel;
