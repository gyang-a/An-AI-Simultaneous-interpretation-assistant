import './ListeningPanel.less';

const waveBars = Array.from({ length: 28 }, (_, index) => index);

function ListeningPanel() {
  return (
    <section className="listening-section" aria-labelledby="listening-title">
      <div className="mode-tabs" aria-label="输入模式">
        <button className="mode-tab active" type="button">
          <span aria-hidden="true">🎙</span>
          实时监听
        </button>
        <button className="mode-tab" type="button">
          <span aria-hidden="true">▣</span>
          导入音频/视频
        </button>
      </div>

      <article className="listening-card">
        <div className="listening-copy">
          <div className="listening-status">
            <span className="status-dot" aria-hidden="true" />
            <h2 id="listening-title">正在监听外部声音...</h2>
          </div>
          <p>请播放你想翻译的演讲、会议或网课内容，系统会自动识别并翻译为中文。</p>
        </div>

        <div className="mic-stage" aria-hidden="true">
          <div className="wave left">
            {waveBars.map((bar) => (
              <span key={`left-${bar}`} />
            ))}
          </div>
          <div className="mic-orb">
            <span>🎙</span>
          </div>
          <div className="wave right">
            {waveBars.map((bar) => (
              <span key={`right-${bar}`} />
            ))}
          </div>
        </div>

        <button className="stop-button" type="button">
          停止监听
        </button>

        <p className="listening-tip">贴士：请确保电脑音量适中，麦克风或系统音频已开启。</p>
      </article>
    </section>
  );
}

export default ListeningPanel;
