/**
 * Muthu Browser — FindBar Component (Ctrl+F)
 *
 * Chrome-style find in page overlay.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { FindMatchInfo } from '../../main/types';
import './FindBar.css';

interface FindBarProps {
  matchInfo: FindMatchInfo | null;
  onFind: (text: string, options?: { forward?: boolean; findNext?: boolean }) => void;
  onClose: () => void;
}

const FindBar: React.FC<FindBarProps> = ({ matchInfo, onFind, onClose }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
      onFind(val, { forward: true, findNext: false });
    } else {
      onFind('', { forward: true, findNext: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onFind(text, { forward: !e.shiftKey, findNext: true });
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleNext = () => onFind(text, { forward: true, findNext: true });
  const handlePrev = () => onFind(text, { forward: false, findNext: true });

  const matchText = matchInfo && text.trim()
    ? matchInfo.matches > 0
      ? `${matchInfo.activeMatchOrdinal} of ${matchInfo.matches}`
      : 'No matches'
    : '';

  return (
    <div className="find-bar" id="find-bar">
      <input
        ref={inputRef}
        type="text"
        className="find-input"
        placeholder="Find in page..."
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        id="find-input"
      />
      {matchText && <span className="find-count">{matchText}</span>}
      <button className="find-btn" onClick={handlePrev} title="Previous match (Shift+Enter)">▲</button>
      <button className="find-btn" onClick={handleNext} title="Next match (Enter)">▼</button>
      <button className="find-close-btn" onClick={onClose} title="Close find bar (Esc)">✕</button>
    </div>
  );
};

export default FindBar;
