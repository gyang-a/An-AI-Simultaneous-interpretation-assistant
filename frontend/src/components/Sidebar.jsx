const navItems = [
  { label: '实时翻译', icon: '◆' },
  { label: '导入翻译', icon: '⇩' },
  { label: '历史记录', icon: '◷' },
  { label: '术语库', icon: '▤' },
  { label: '字幕记录', icon: 'CC' },
  { label: '设置', icon: '⚙' }
];

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <strong>AI同声传译助手</strong>
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

      <button className="theme-toggle" type="button">
        <span className="theme-icon" aria-hidden="true">
          ◐
        </span>
        深色模式
        <span className="theme-chevron" aria-hidden="true">
          ˅
        </span>
      </button>
    </aside>
  );
}

export default Sidebar;
