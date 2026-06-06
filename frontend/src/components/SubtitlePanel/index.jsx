import { useEffect, useRef, useState } from 'react';
import './SubtitlePanel.less';

function formatRecordTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function SubtitlePanel({ items, isListening, historyItems }) {
  const [activeView, setActiveView] = useState('realtime');
  const hasItems = items.length > 0;
  const hasHistory = historyItems.length > 0;
  const viewportRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const isRealtimeView = activeView === 'realtime';

  const handleViewportScroll = () => {
    if (!viewportRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    shouldStickToBottomRef.current = scrollHeight - scrollTop - clientHeight < 48;
  };

  useEffect(() => {
    if (isRealtimeView && viewportRef.current && shouldStickToBottomRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [items, isRealtimeView]);

  return (
    <section className="subtitle-panel" aria-labelledby="subtitle-title">
      <div className="subtitle-header">
        <div className="subtitle-tabs" aria-label="字幕视图">
          <button
            className={isRealtimeView ? 'subtitle-tab active' : 'subtitle-tab'}
            type="button"
            id="subtitle-title"
            onClick={() => setActiveView('realtime')}
          >
            实时字幕
          </button>
          <button
            className={!isRealtimeView ? 'subtitle-tab active' : 'subtitle-tab'}
            type="button"
            onClick={() => setActiveView('history')}
          >
            翻译记录
          </button>
        </div>
      </div>

      {isRealtimeView && hasItems ? (
        <div
          className="subtitle-scroll"
          onScroll={handleViewportScroll}
          ref={viewportRef}
        >
          <ol className="subtitle-list">
            {items.map((item, index) => {
              const isActive = index === items.length - 1;
              const isRevised = item.type === 'revision';
              const itemClassName = [
                'subtitle-item',
                isActive ? 'active' : '',
                isRevised ? 'revised' : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li className={itemClassName} key={item.id}>
                  <time>{item.time}</time>
                  <div className="subtitle-copy">
                    <p>{item.source}</p>
                    <strong>{item.translation}</strong>
                    {isRevised && item.revisionReason && (
                      <small className="revision-reason">
                        翻译修正说明：{item.revisionReason}
                      </small>
                    )}
                  </div>
                  <span className={isRevised ? 'subtitle-status revised' : 'subtitle-status'}>
                    {item.status}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : isRealtimeView ? (
        <div className="subtitle-empty">
          {isListening ? '正在等待第一条字幕...' : '点击开始监听后，实时字幕会显示在这里。'}
        </div>
      ) : hasHistory ? (
        <div className="subtitle-scroll history-scroll">
          <ol className="history-list">
            {historyItems.map((record) => (
              <li className="history-record" key={record.id}>
                <header className="history-record-header">
                  <div>
                    <time>{formatRecordTime(record.startedAt)}</time>
                    <span>{record.items.length} 条字幕</span>
                  </div>
                  <strong>{formatRecordTime(record.endedAt)}</strong>
                </header>

                <ol className="history-segment-list">
                  {record.items.map((item) => (
                    <li className="history-segment" key={`${record.id}-${item.id}`}>
                      <time>{item.time}</time>
                      <div>
                        <p>{item.source}</p>
                        <strong>{item.translation || '翻译中'}</strong>
                      </div>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="subtitle-empty">
          停止监听后，本次翻译会保存到这里。
        </div>
      )}
    </section>
  );
}

export default SubtitlePanel;
