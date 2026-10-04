import React, { useState } from 'react';
import './PermissionPrompt.css';

export interface PermissionPromptData {
  id: string;
  origin: string;
  permission: string;
  title: string;
}

interface PermissionPromptProps {
  prompt: PermissionPromptData;
  onRespond: (id: string, decision: 'allow' | 'block', remember: boolean) => void;
}

const ICONS: Record<string, string> = {
  location: '📍',
  camera: '📷',
  microphone: '🎤',
  notifications: '🔔',
  'clipboard-read': '📋',
  midi: '🎹',
  sensors: '🧭',
  'screen-capture': '🖥️',
};

const TITLES: Record<string, string> = {
  location: 'know your location',
  camera: 'use your camera',
  microphone: 'use your microphone',
  notifications: 'show notifications',
  'clipboard-read': 'read your clipboard',
  midi: 'access MIDI devices',
  sensors: 'access device motion and orientation',
  'screen-capture': 'record or share your screen',
};

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({ prompt, onRespond }) => {
  const [remember, setRemember] = useState(true);

  const icon = ICONS[prompt.permission] || '🛡️';
  const actionText = TITLES[prompt.permission] || prompt.permission;

  return (
    <div className="permission-prompt-card" role="dialog" aria-modal="true">
      <div className="permission-prompt-header">
        <span className="permission-prompt-icon">{icon}</span>
        <div className="permission-prompt-text">
          <div className="permission-prompt-origin">{prompt.origin}</div>
          <div className="permission-prompt-desc">wants to {actionText}</div>
        </div>
      </div>

      <div className="permission-prompt-options">
        <label className="permission-prompt-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember this decision</span>
        </label>
      </div>

      <div className="permission-prompt-actions">
        <button
          className="btn-perm btn-perm-block"
          onClick={() => onRespond(prompt.id, 'block', remember)}
        >
          Block
        </button>
        <button
          className="btn-perm btn-perm-allow"
          onClick={() => onRespond(prompt.id, 'allow', remember)}
        >
          Allow
        </button>
      </div>
    </div>
  );
};

export default PermissionPrompt;
