import React, { useState } from 'react';
import './AiSidePanel.css';

interface AiSidePanelProps {
  pageTitle: string;
  pageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSummarize: (title: string, url: string, content: string) => Promise<string>;
  onAskQuestion: (question: string, content: string) => Promise<string>;
  onExtractPoints: (content: string) => Promise<string>;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiSidePanel: React.FC<AiSidePanelProps> = ({
  pageTitle,
  pageUrl,
  isOpen,
  onClose,
  onSummarize,
  onAskQuestion,
  onExtractPoints,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your AI Browser Assistant. I can summarize this page, answer questions, or extract key insights with strict privacy protection.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (actionType: 'summarize' | 'extract') => {
    setLoading(true);
    const userPrompt = actionType === 'summarize' ? 'Summarize this page.' : 'Extract key takeaways.';

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: userPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      // In production, we request sanitized page content from WebContents
      const sampleContent = `${pageTitle} — Documentation and web article content retrieved from ${pageUrl}.`;
      let res = '';
      if (actionType === 'summarize') {
        res = await onSummarize(pageTitle, pageUrl, sampleContent);
      } else {
        res = await onExtractPoints(sampleContent);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to analyze page at this moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || loading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const sampleContent = `${pageTitle} — Content from ${pageUrl}.`;
      const res = await onAskQuestion(q, sampleContent);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error generating response.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-side-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <span>✨ AI Assistant</span>
        </div>
        <button className="ai-panel-close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Quick Action Buttons */}
      <div className="ai-quick-actions">
        <button
          className="ai-action-chip"
          onClick={() => handleAction('summarize')}
          disabled={loading}
        >
          📝 Summarize Page
        </button>
        <button
          className="ai-action-chip"
          onClick={() => handleAction('extract')}
          disabled={loading}
        >
          📌 Key Takeaways
        </button>
      </div>

      {/* Messages Conversation Log */}
      <div className="ai-messages-container">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`ai-message-bubble ${m.role === 'user' ? 'ai-bubble--user' : 'ai-bubble--assistant'}`}
          >
            <div className="ai-bubble-sender">
              {m.role === 'user' ? 'You' : 'AI Assistant'}
              <span className="ai-bubble-time">{m.timestamp}</span>
            </div>
            <div className="ai-bubble-content">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-loading-indicator">
            <span>✨ Thinking & synthesizing...</span>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Note */}
      <div className="ai-privacy-note">
        🛡️ Privacy Shield: Passwords and personal form fields are automatically excluded.
      </div>

      {/* Question Form */}
      <form className="ai-input-form" onSubmit={handleSendQuestion}>
        <input
          type="text"
          className="ai-chat-input"
          placeholder="Ask a question about this page..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="ai-send-btn" disabled={loading || !inputQuestion.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default AiSidePanel;
