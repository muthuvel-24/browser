/**
 * Muthu Browser — Chrome Desktop Bookmarks Bar Component
 */

import React from 'react';
import './BookmarksBar.css';

interface BookmarksBarProps {
  onNavigate: (url: string) => void;
}

const DEFAULT_BOOKMARKS = [
  { name: 'Google', url: 'https://www.google.com', icon: '🌐' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉️' },
  { name: 'Maps', url: 'https://maps.google.com', icon: '📍' },
  { name: 'Drive', url: 'https://drive.google.com', icon: '📁' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'ChatGPT', url: 'https://chatgpt.com', icon: '🤖' },
  { name: 'Claude AI', url: 'https://claude.ai', icon: '💡' },
];

const BookmarksBar: React.FC<BookmarksBarProps> = ({ onNavigate }) => {
  return (
    <div className="chrome-bookmarks-bar" id="chrome-bookmarks-bar">
      {DEFAULT_BOOKMARKS.map((bm, index) => (
        <button
          key={index}
          className="bookmark-item"
          onClick={() => onNavigate(bm.url)}
          title={bm.url}
        >
          <span className="bookmark-favicon">{bm.icon}</span>
          <span>{bm.name}</span>
        </button>
      ))}
    </div>
  );
};

export default BookmarksBar;
