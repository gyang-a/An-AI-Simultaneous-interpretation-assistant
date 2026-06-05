import { useEffect, useRef, useState } from 'react';
import './QuickActionsPanel.less';

const COPY_FEEDBACK_MS = 1600;

function formatSubtitleText(items) {
  return items
    .map((item) => item.translation || item.source)
    .filter(Boolean)
    .join('\n');
}

async function copyText(text) {
  if (!text) {
    return false;
  }

  await navigator.clipboard?.writeText(text);
  return true;
}

function QuickActionsPanel({ subtitleItems, onClearSubtitles }) {
  const [isCopyToastVisible, setIsCopyToastVisible] = useState(false);
  const copyTimerRef = useRef(null);
  const hasSubtitles = subtitleItems.length > 0;

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  const showCopyToast = () => {
    window.clearTimeout(copyTimerRef.current);
    setIsCopyToastVisible(true);
    copyTimerRef.current = window.setTimeout(() => {
      setIsCopyToastVisible(false);
    }, COPY_FEEDBACK_MS);
  };

  const handleCopySubtitles = async () => {
    const didCopy = await copyText(formatSubtitleText(subtitleItems));
    if (didCopy) {
      showCopyToast();
    }
  };

  const actions = [
    {
      label: '复制字幕',
      icon: 'C',
      disabled: !hasSubtitles,
      onClick: handleCopySubtitles
    },
    {
      label: '清空字幕',
      icon: 'X',
      disabled: !hasSubtitles,
      onClick: onClearSubtitles
    }
  ];

  return (
    <section className="quick-actions-panel" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title">快捷操作</h2>

      {isCopyToastVisible && (
        <div className="copy-toast" role="status">
          复制成功
        </div>
      )}

      <div className="quick-action-list">
        {actions.map((action) => (
          <button
            className="quick-action"
            disabled={action.disabled}
            type="button"
            key={action.label}
            onClick={action.onClick}
          >
            <span className="quick-action-icon" aria-hidden="true">
              {action.icon}
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActionsPanel;
