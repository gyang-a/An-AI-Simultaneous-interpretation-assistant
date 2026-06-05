import { useEffect, useRef } from 'react';
import './SubtitlePanel.less';

function SubtitlePanel({ items, isListening }) {
  const hasItems = items.length > 0;
  const viewportRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  const handleViewportScroll = () => {
    if (!viewportRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    shouldStickToBottomRef.current = scrollHeight - scrollTop - clientHeight < 48;
  };

  useEffect(() => {
    if (viewportRef.current && shouldStickToBottomRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [items]);

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
      </div>

      {hasItems ? (
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
      ) : (
        <div className="subtitle-empty">
          {isListening ? '正在等待第一条字幕...' : '点击开始监听后，实时字幕会显示在这里。'}
        </div>
      )}
    </section>
  );
}

export default SubtitlePanel;
