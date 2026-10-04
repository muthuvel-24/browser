import React from 'react';
import type { AiSearchResult } from '../../main/search-client';
import './AiSearchPage.css';

interface AiSearchPageProps {
  searchData: AiSearchResult;
  onNavigate: (url: string) => void;
}

export const AiSearchPage: React.FC<AiSearchPageProps> = ({ searchData, onNavigate }) => {
  const { query, aiAnswer, sources, webResults, relatedQueries } = searchData;

  return (
    <div className="ai-search-container">
      {/* Search Header */}
      <div className="ai-search-header">
        <h1 className="ai-search-title">AI Hybrid Search: <span className="ai-search-query">"{query}"</span></h1>
        <div className="ai-search-badge-row">
          <span className="search-pill-badge">⚡ BM25 Keyword + Vector Semantic</span>
          <span className="search-pill-badge">🛡️ Privacy Protected (Zero Profile Logging)</span>
        </div>
      </div>

      {/* 1. AI Synthesized Answer Card */}
      <div className="ai-answer-card">
        <div className="ai-answer-header">
          <div className="ai-answer-label">
            <span className="ai-sparkle-icon">✨</span>
            <strong>AI Synthesized Answer</strong>
          </div>
          <span className="ai-evidence-tag">
            {aiAnswer.hasSufficientEvidence ? 'Evidence-Backed' : 'Limited Evidence'}
          </span>
        </div>

        <div className="ai-answer-body">
          <p className="ai-answer-text">{aiAnswer.text}</p>
        </div>

        {/* Citations and Disclaimers */}
        <div className="ai-answer-footer">
          <small className="ai-disclaimer">
            Information synthesized from retrieved web corpus. Always verify primary sources.
          </small>
        </div>
      </div>

      {/* 2. Cited Sources Carousel */}
      {sources && sources.length > 0 && (
        <div className="ai-sources-section">
          <h3 className="section-heading">Primary Sources ({sources.length})</h3>
          <div className="ai-sources-grid">
            {sources.map((src, idx) => (
              <div
                key={src.id}
                className="ai-source-card"
                onClick={() => onNavigate(src.url)}
              >
                <div className="source-domain">
                  <span className="source-number">[{idx + 1}]</span>
                  <span className="source-host">{src.domain}</span>
                </div>
                <div className="source-title">{src.title}</div>
                <div className="source-snippet">{src.snippet}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Ranked Web Results */}
      <div className="ai-web-results-section">
        <h3 className="section-heading">Ranked Search Results</h3>
        <div className="web-results-list">
          {webResults.map((item) => (
            <div key={item.url} className="web-result-item">
              <div className="web-result-meta">
                <span className="web-result-domain">{item.domain}</span>
                <span className="web-result-score">Match Score: {Math.round((item.bm25Score * 0.4 + item.vectorScore * 0.6) * 100)}%</span>
              </div>
              <h4
                className="web-result-title"
                onClick={() => onNavigate(item.url)}
              >
                {item.title}
              </h4>
              <p className="web-result-snippet">{item.snippet}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Related Queries */}
      {relatedQueries && relatedQueries.length > 0 && (
        <div className="ai-related-section">
          <h4 className="related-heading">Related Searches</h4>
          <div className="related-pills">
            {relatedQueries.map((rq) => (
              <button
                key={rq}
                className="related-pill-btn"
                onClick={() => onNavigate(rq)}
              >
                🔍 {rq}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSearchPage;
