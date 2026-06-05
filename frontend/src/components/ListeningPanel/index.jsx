import './ListeningPanel.less';

const waveBars = Array.from({ length: 28 }, (_, index) => index);

function ListeningPanel({ isListening, onStartListening, onStopListening }) {
  const title = isListening ? '正在监听外部声音...' : '等待开始监听';
  const description = isListening
    ? '请播放你想翻译的演讲、会议或网课内容，系统会自动识别并翻译为中文。'
    : '点击开始监听后，系统将准备接收单向音频流并生成中文字幕。';

  return (
    <section className="listening-section" aria-labelledby="listening-title">
      <div className="mode-tabs" aria-label="输入模式">
        <button
          className={isListening ? 'mode-tab active' : 'mode-tab'}
          type="button"
          onClick={onStartListening}
          disabled={isListening}
        >
          <span aria-hidden="true">MIC</span>
          实时监听
        </button>
        <button className="mode-tab" type="button">
          <span aria-hidden="true">FILE</span>
          导入音频/视频
        </button>
      </div>

      <article className={isListening ? 'listening-card active' : 'listening-card'}>
        <div className="listening-copy">
          <div className="listening-status">
            <span
              className={isListening ? 'status-dot active' : 'status-dot'}
              aria-hidden="true"
            />
            <h2 id="listening-title">{title}</h2>
          </div>
          <p>{description}</p>
        </div>

        <div className="mic-stage" aria-hidden="true">
          <div className="wave left">
            {waveBars.map((bar) => (
              <span key={`left-${bar}`} />
            ))}
          </div>
          <div className={isListening ? 'mic-orb active' : 'mic-orb'}>
            <span>MIC</span>
          </div>
          <div className="wave right">
            {waveBars.map((bar) => (
              <span key={`right-${bar}`} />
            ))}
          </div>
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

        <p className="listening-tip">
          贴士：请确保电脑音量适中，麦克风或系统音频已开启。
        </p>
      </article>
    </section>
  );
}

export default ListeningPanel;
