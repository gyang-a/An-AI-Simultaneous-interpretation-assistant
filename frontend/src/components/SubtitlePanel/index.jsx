import './SubtitlePanel.less';

const subtitleItems = [
  {
    id: 'caption-001',
    time: '00:01:23',
    source: 'The rapid advancement of AI is transforming the way we work and live.',
    translation: '人工智能的快速发展正在改变我们的工作和生活方式。',
    status: '已确认'
  },
  {
    id: 'caption-002',
    time: '00:01:28',
    source: 'It has the potential to improve productivity and automate tasks,',
    translation: '它有潜力提高生产力，并自动化任务，',
    status: '翻译中'
  },
  {
    id: 'caption-003',
    time: '00:01:32',
    source: 'and create new opportunities across various industries.',
    translation: '并在各个行业创造新的机会。',
    status: '待确认'
  }
];

function SubtitlePanel() {
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

      <ol className="subtitle-list">
        {subtitleItems.map((item, index) => (
          <li
            className={index === 1 ? 'subtitle-item active' : 'subtitle-item'}
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

      <button className="show-more" type="button">
        显示更多
      </button>
    </section>
  );
}

export default SubtitlePanel;
