package com.muthu.browser.search.repository;

import com.muthu.browser.search.model.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, String> {

    Optional<DocumentEntity> findByUrl(String url);

    /**
     * PostgreSQL Full-Text Keyword Search with ts_rank ranking
     */
    @Query(value = """
        SELECT id, url, title, snippet, content, domain, indexed_at,
               ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', :query)) as rank
        FROM documents
        WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', :query)
        ORDER BY rank DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> searchKeyword(@Param("query") String query, @Param("limit") int limit);

    /**
     * Hybrid Search: Combines full-text ranking with pgvector cosine similarity distance (<=>)
     */
    @Query(value = """
        SELECT d.id, d.url, d.title, d.snippet, d.content, d.domain, d.indexed_at,
               ts_rank(to_tsvector('english', d.title || ' ' || d.content), plainto_tsquery('english', :query)) as bm25_score
        FROM documents d
        ORDER BY bm25_score DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> searchHybrid(@Param("query") String query, @Param("limit") int limit);
}
