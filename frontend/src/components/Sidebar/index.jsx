import './Sidebar.less';

const navItems = [
  { label: '实时翻译', icon: 'RT' },
  { label: '历史记录', icon: 'HI' },
  { label: '字幕记录', icon: 'CC' }
];

function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <strong>AI 同声传译助手</strong>
      </div>

      <nav className="nav-list" aria-label="功能导航">
        {navItems.map((item, index) => (
          <button
            className={index === 0 ? 'nav-item active' : 'nav-item'}
            type="button"
            key={item.label}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="sidebar-settings" aria-labelledby="sidebar-settings-title">
        <div className="sidebar-settings-title">
          <span className="nav-icon" aria-hidden="true">SET</span>
          <h2 id="sidebar-settings-title">设置</h2>
        </div>
        <button className="logout-button" type="button" onClick={onLogout}>
          退出登录
        </button>
      </section>
    </aside>
  );
}

export default Sidebar;
