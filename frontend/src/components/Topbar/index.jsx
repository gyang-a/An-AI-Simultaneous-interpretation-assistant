import './Topbar.less';

function Topbar({ title = '实时翻译', description = '实时监听外部声音并翻译，帮助你跟上演讲、会议和网课内容。' }) {
  return (
    <header className="topbar">
      <div>
        <h1 id="page-title">{title}</h1>
        <p>{description}</p>
      </div>

      <div className="topbar-actions">
        <div className="language-switch" aria-label="翻译语言">
          <span>英文 (English)</span>
          <span aria-hidden="true">→</span>
          <strong>中文 (简体)</strong>
        </div>
        <button className="settings-button" type="button" aria-label="设置">
          ⚙
        </button>
      </div>
    </header>
  );
}

export default Topbar;
