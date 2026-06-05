import './QuickActionsPanel.less';

const actions = [
  { label: '复制字幕', shortcut: '⌘ C', icon: '□' },
  { label: '导出字幕', shortcut: '⌘ S', icon: '⇩' },
  { label: '清空字幕', shortcut: '⌘ K', icon: '⌫' },
  { label: '打开悬浮字幕', shortcut: '↗', icon: '▣' }
];

function QuickActionsPanel() {
  return (
    <section className="quick-actions-panel" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title">快捷操作</h2>

      <div className="quick-action-list">
        {actions.map((action) => (
          <button className="quick-action" type="button" key={action.label}>
            <span className="quick-action-icon" aria-hidden="true">
              {action.icon}
            </span>
            <span>{action.label}</span>
            <kbd>{action.shortcut}</kbd>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActionsPanel;
