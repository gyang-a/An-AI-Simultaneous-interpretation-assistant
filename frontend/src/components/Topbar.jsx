function Topbar() {
  return (
    <header className="topbar">
      <div>
        <h1 id="page-title">实时翻译</h1>
        <p>实时监听外部声音并翻译，帮助你跟上演讲、会议和网课内容。</p>
      </div>

      <div className="language-switch" aria-label="翻译语言">
        <span>英文 (English)</span>
        <span aria-hidden="true">→</span>
        <strong>中文 (简体)</strong>
      </div>
    </header>
  );
}

export default Topbar;
