package com.muthu.browser.search.dto;

import java.util.List;

public class SearchResponseDto {

    private String query;
    private AiAnswerDto aiAnswer;
    private List<SourceDto> sources;
    private List<WebResultDto> webResults;
    private List<String> relatedQueries;
    private boolean isOfflineFallback;

    public SearchResponseDto() {}

    public SearchResponseDto(String query, AiAnswerDto aiAnswer, List<SourceDto> sources,
                             List<WebResultDto> webResults, List<String> relatedQueries) {
        this.query = query;
        this.aiAnswer = aiAnswer;
        this.sources = sources;
        this.webResults = webResults;
        this.relatedQueries = relatedQueries;
        this.isOfflineFallback = false;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public AiAnswerDto getAiAnswer() { return aiAnswer; }
    public void setAiAnswer(AiAnswerDto aiAnswer) { this.aiAnswer = aiAnswer; }

    public List<SourceDto> getSources() { return sources; }
    public void setSources(List<SourceDto> sources) { this.sources = sources; }

    public List<WebResultDto> getWebResults() { return webResults; }
    public void setWebResults(List<WebResultDto> webResults) { this.webResults = webResults; }

    public List<String> getRelatedQueries() { return relatedQueries; }
    public void setRelatedQueries(List<String> relatedQueries) { this.relatedQueries = relatedQueries; }

    public boolean isOfflineFallback() { return isOfflineFallback; }
    public void setOfflineFallback(boolean offlineFallback) { isOfflineFallback = offlineFallback; }

    public static class AiAnswerDto {
        private String text;
        private List<CitationDto> citations;
        private boolean hasSufficientEvidence;

        public AiAnswerDto() {}
        public AiAnswerDto(String text, List<CitationDto> citations, boolean hasSufficientEvidence) {
            this.text = text;
            this.citations = citations;
            this.hasSufficientEvidence = hasSufficientEvidence;
        }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public List<CitationDto> getCitations() { return citations; }
        public void setCitations(List<CitationDto> citations) { this.citations = citations; }

        public boolean isHasSufficientEvidence() { return hasSufficientEvidence; }
        public void setHasSufficientEvidence(boolean hasSufficientEvidence) { this.hasSufficientEvidence = hasSufficientEvidence; }
    }

    public static class CitationDto {
        private String sourceId;
        private int citationIndex;
        private String quote;

        public CitationDto() {}
        public CitationDto(String sourceId, int citationIndex, String quote) {
            this.sourceId = sourceId;
            this.citationIndex = citationIndex;
            this.quote = quote;
        }

        public String getSourceId() { return sourceId; }
        public void setSourceId(String sourceId) { this.sourceId = sourceId; }

        public int getCitationIndex() { return citationIndex; }
        public void setCitationIndex(int citationIndex) { this.citationIndex = citationIndex; }

        public String getQuote() { return quote; }
        public void setQuote(String quote) { this.quote = quote; }
    }

    public static class SourceDto {
        private String id;
        private String title;
        private String url;
        private String domain;
        private String snippet;
        private double score;

        public SourceDto() {}
        public SourceDto(String id, String title, String url, String domain, String snippet, double score) {
            this.id = id;
            this.title = title;
            this.url = url;
            this.domain = domain;
            this.snippet = snippet;
            this.score = score;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }

        public String getSnippet() { return snippet; }
        public void setSnippet(String snippet) { this.snippet = snippet; }

        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
    }

    public static class WebResultDto {
        private String title;
        private String url;
        private String snippet;
        private String domain;
        private double bm25Score;
        private double vectorScore;
        private int finalRank;

        public WebResultDto() {}
        public WebResultDto(String title, String url, String snippet, String domain, double bm25Score, double vectorScore, int finalRank) {
            this.title = title;
            this.url = url;
            this.snippet = snippet;
            this.domain = domain;
            this.bm25Score = bm25Score;
            this.vectorScore = vectorScore;
            this.finalRank = finalRank;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getSnippet() { return snippet; }
        public void setSnippet(String snippet) { this.snippet = snippet; }

        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }

        public double getBm25Score() { return bm25Score; }
        public void setBm25Score(double bm25Score) { this.bm25Score = bm25Score; }

        public double getVectorScore() { return vectorScore; }
        public void setVectorScore(double vectorScore) { this.vectorScore = vectorScore; }

        public int getFinalRank() { return finalRank; }
        public void setFinalRank(int finalRank) { this.finalRank = finalRank; }
    }
}
