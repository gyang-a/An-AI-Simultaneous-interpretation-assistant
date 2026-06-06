import { useMemo, useState } from 'react';
import './HistoryPage.less';

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(startedAt, endedAt) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return '--';
  }

  const totalSeconds = Math.round((end - start) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}分${seconds}秒`;
}

function getRecordSummary(record) {
  return record.items
    .map((item) => item.translation || item.source)
    .filter(Boolean)
    .slice(0, 3)
    .join(' / ') || '暂无字幕内容';
}

function HistoryPage({ historyItems }) {
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const selectedRecord = useMemo(() => {
    if (!historyItems.length) {
      return null;
    }

    return historyItems.find((record) => record.id === selectedRecordId) || historyItems[0];
  }, [historyItems, selectedRecordId]);

  if (!historyItems.length) {
    return (
      <section className="history-page" aria-labelledby="history-page-title">
        <div className="history-empty">
          <h2 id="history-page-title">历史记录</h2>
          <p>完成一次监听后，翻译会话会保存到这里。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="history-page" aria-labelledby="history-page-title">
      <div className="history-page-header">
        <div>
          <h2 id="history-page-title">历史记录</h2>
          <p>按会话查看已保存的同声传译记录。</p>
        </div>
        <strong>{historyItems.length} 个会话</strong>
      </div>

      <div className="history-page-grid">
        <ol className="history-record-list" aria-label="历史会话列表">
          {historyItems.map((record) => {
            const isActive = record.id === selectedRecord?.id;

            return (
              <li key={record.id}>
                <button
                  className={isActive ? 'history-record-button active' : 'history-record-button'}
                  type="button"
                  onClick={() => setSelectedRecordId(record.id)}
                >
                  <span>{formatDateTime(record.startedAt)}</span>
                  <strong>{record.items.length} 条字幕</strong>
                  <small>{getRecordSummary(record)}</small>
                </button>
              </li>
            );
          })}
        </ol>

        {selectedRecord && (
          <article className="history-detail" aria-label="历史会话详情">
            <header className="history-detail-header">
              <div>
                <h3>{formatDateTime(selectedRecord.startedAt)} 的翻译</h3>
                <p>{formatDuration(selectedRecord.startedAt, selectedRecord.endedAt)}</p>
              </div>
              <span>{selectedRecord.items.length} 条字幕</span>
            </header>

            <ol className="history-detail-list">
              {selectedRecord.items.map((item) => (
                <li className="history-detail-item" key={`${selectedRecord.id}-${item.id}`}>
                  <time>{item.time}</time>
                  <div>
                    <p>{item.source}</p>
                    <strong>{item.translation || '翻译中'}</strong>
                    {item.revisionReason && (
                      <small>修正说明：{item.revisionReason}</small>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        )}
      </div>
    </section>
  );
}

export default HistoryPage;
