package com.muthu.browser.search.controller;

import com.muthu.browser.search.dto.SearchResponseDto;
import com.muthu.browser.search.security.SafeUrlValidator;
import com.muthu.browser.search.service.HybridSearchService;
import com.muthu.browser.search.service.PoliteCrawlerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"})
public class SearchController {

    private final HybridSearchService searchService;
    private final PoliteCrawlerService crawlerService;
    private final SafeUrlValidator safeUrlValidator;

    @Value("${crawler.api.secret-key:muthu-local-secret-crawler-key}")
    private String crawlerSecretKey;

    public SearchController(HybridSearchService searchService,
                            PoliteCrawlerService crawlerService,
                            SafeUrlValidator safeUrlValidator) {
        this.searchService = searchService;
        this.crawlerService = crawlerService;
        this.safeUrlValidator = safeUrlValidator;
    }

    @GetMapping("/search")
    public ResponseEntity<SearchResponseDto> search(@RequestParam("q") String query) {
        SearchResponseDto result = searchService.search(query);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/crawl")
    public ResponseEntity<Map<String, String>> crawl(@RequestParam("url") String url,
                                                     @RequestParam(value = "depth", defaultValue = "1") int depth,
                                                     @RequestHeader(value = "X-Crawler-Key", required = false) String apiKey) {
        // Enforce constant-time authorization check for crawler trigger endpoint
        if (apiKey == null || !java.security.MessageDigest.isEqual(
                apiKey.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                crawlerSecretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "forbidden", "message", "Invalid or missing X-Crawler-Key header"));
        }

        if (depth < 0 || depth > 3) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "rejected", "message", "Depth must be between 0 and 3"));
        }

        // Validate URL upfront against SSRF
        try {
            safeUrlValidator.validateAndResolve(url);
        } catch (SecurityException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "rejected", "message", "SSRF validation failed: " + e.getMessage()));
        }

        if (!crawlerService.isAllowedByRobots(url)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "rejected", "message", "URL disallowed by robots.txt"));
        }

        crawlerService.crawlAndIndex(url, depth);
        return ResponseEntity.ok(Map.of("status", "accepted", "message", "Polite crawl job initiated for " + url));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Muthu Search Backend",
                "pgvector", "ready",
                "crawler", "polite",
                "ssrf-protection", "active"
        ));
    }
}
