import './RealtimeStatusPanel.less';

const bars = Array.from({ length: 34 }, (_, index) => index);

function formatDuration(durationMs) {
  const safeDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const totalSeconds = Math.floor(safeDurationMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function RealtimeStatusPanel({ isListening, playbackOffsetMs, subtitleItems }) {
  const metrics = [
    {
      label: '监听时长',
      value: formatDuration(playbackOffsetMs),
      grade: isListening ? '进行中' : '待机'
    },
    {
      label: '字幕条数',
      value: String(subtitleItems.length),
      grade: subtitleItems.length ? '实时' : '等待'
    }
  ];

  return (
    <section className="realtime-status-panel" aria-labelledby="realtime-status-title">
      <div className="status-panel-header">
        <h2 id="realtime-status-title">实时状态</h2>
      </div>

      <dl className="metric-list">
        {metrics.map((metric) => (
          <div className="metric-item" key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>
              <strong>{metric.value}</strong>
              {metric.grade && <span>{metric.grade}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className={isListening ? 'mini-wave active' : 'mini-wave'} aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar} />
        ))}
      </div>
    </section>
  );
}

export default RealtimeStatusPanel;
