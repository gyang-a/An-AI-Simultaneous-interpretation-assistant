import './RealtimeStatusPanel.less';

const metrics = [
  { label: '延迟', value: '1.2 秒', grade: '优秀' },
  { label: '准确率', value: '96.3%', grade: '优秀' },
  { label: '已翻译时长', value: '00:15:42' }
];

const bars = Array.from({ length: 34 }, (_, index) => index);

function RealtimeStatusPanel() {
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

      <div className="mini-wave" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar} />
        ))}
      </div>
    </section>
  );
}

export default RealtimeStatusPanel;
