import './RealtimeStatusPanel.less';
import { getMockRealtimeStatus } from '../../mocks/subtitleEvents';

const bars = Array.from({ length: 34 }, (_, index) => index);

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getLatencyGrade(latencyMs) {
  if (!latencyMs) {
    return '待机';
  }

  return latencyMs <= 1200 ? '优秀' : '良好';
}

function RealtimeStatusPanel({ isListening, playbackOffsetMs }) {
  const realtimeStatus = getMockRealtimeStatus(playbackOffsetMs);
  const metrics = [
    {
      label: '延迟',
      value: isListening ? `${(realtimeStatus.latencyMs / 1000).toFixed(1)} 秒` : '--',
      grade: getLatencyGrade(realtimeStatus.latencyMs)
    },
    {
      label: '准确率',
      value: isListening ? `${realtimeStatus.accuracy.toFixed(1)}%` : '--',
      grade: isListening ? '模拟' : '待机'
    },
    {
      label: '已翻译时长',
      value: formatDuration(realtimeStatus.translatedDurationMs),
      grade: isListening ? '进行中' : '待机'
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

      <div className="mini-wave" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar} />
        ))}
      </div>
    </section>
  );
}

export default RealtimeStatusPanel;
