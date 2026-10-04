package com.muthu.browser.search.controller;

import com.muthu.browser.search.dto.SearchResponseDto;
import com.muthu.browser.search.service.HybridSearchService;
import com.muthu.browser.search.service.PoliteCrawlerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class SearchController {

    private final HybridSearchService searchService;
    private final PoliteCrawlerService crawlerService;

    public SearchController(HybridSearchService searchService, PoliteCrawlerService crawlerService) {
        this.searchService = searchService;
        this.crawlerService = crawlerService;
    }

    @GetMapping("/search")
    public ResponseEntity<SearchResponseDto> search(@RequestParam("q") String query) {
        SearchResponseDto result = searchService.search(query);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/crawl")
    public ResponseEntity<Map<String, String>> crawl(@RequestParam("url") String url,
                                                     @RequestParam(value = "depth", defaultValue = "1") int depth) {
        if (!crawlerService.isAllowedByRobots(url)) {
            return ResponseEntity.badRequest().body(Map.of("status", "rejected", "message", "URL disallowed by robots.txt"));
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
                "crawler", "polite"
        ));
    }
}
