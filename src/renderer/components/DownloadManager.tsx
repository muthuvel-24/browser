/**
 * Muthu Browser — DownloadManager Component
 *
 * Shows active and completed downloads indicator badge.
 */

import React, { useState } from 'react';
import type { DownloadItemInfo } from '../../main/types';
import './DownloadManager.css';

interface DownloadManagerProps {
  downloads: DownloadItemInfo[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({ downloads }) => {
  const [showPopup, setShowPopup] = useState(false);

  const activeCount = downloads.filter((d) => d.state === 'progressing').length;

  if (downloads.length === 0) return null;

  return (
    <div className="download-manager-wrapper" id="download-manager">
      <button
        className={`download-btn ${activeCount > 0 ? 'download-btn--active' : ''}`}
        onClick={() => setShowPopup(!showPopup)}
        title={`${downloads.length} downloads (${activeCount} active)`}
      >
        📥
        {activeCount > 0 && <span className="download-badge">{activeCount}</span>}
      </button>

      {showPopup && (
        <div className="download-popup">
          <div className="download-popup-header">
            <span>Downloads ({downloads.length})</span>
            <button className="download-popup-close" onClick={() => setShowPopup(false)}>✕</button>
          </div>
          <div className="download-list">
            {downloads.map((item) => {
              const pct = item.totalBytes > 0
                ? Math.round((item.receivedBytes / item.totalBytes) * 100)
                : 0;

              return (
                <div key={item.id} className="download-item">
                  <div className="download-icon">
                    {item.state === 'completed' ? '✅' : item.state === 'progressing' ? '⏳' : '❌'}
                  </div>
                  <div className="download-info">
                    <div className="download-filename" title={item.filename}>{item.filename}</div>
                    <div className="download-details">
                      {item.state === 'progressing' ? (
                        <>
                          <span>{formatBytes(item.receivedBytes)} of {formatBytes(item.totalBytes)} ({pct}%)</span>
                          <div className="download-progress-bar">
                            <div className="download-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </>
                      ) : (
                        <span className={`download-status download-status--${item.state}`}>
                          {item.state === 'completed' ? `Completed (${formatBytes(item.totalBytes)})` : item.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadManager;
