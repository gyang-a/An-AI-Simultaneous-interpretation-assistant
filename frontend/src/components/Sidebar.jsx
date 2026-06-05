const navItems = ['实时翻译', '导入翻译', '历史记录', '术语库', '字幕记录', '设置'];

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
            key={item}
          >
            <span className="nav-icon" aria-hidden="true">
              {index + 1}
            </span>
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
