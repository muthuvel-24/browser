package com.muthu.browser.search.service;

import com.muthu.browser.search.model.DocumentEntity;
import com.muthu.browser.search.repository.DocumentRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URL;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PoliteCrawlerService {

    private static final Logger log = LoggerFactory.getLogger(PoliteCrawlerService.class);

    private final DocumentRepository documentRepository;
    private final Map<String, Long> domainLastVisit = new ConcurrentHashMap<>();

    @Value("${crawler.politeness.delay-ms:1000}")
    private long politenessDelayMs;

    @Value("${crawler.user-agent:MuthuBrowserBot/1.0}")
    private String userAgent;

    public PoliteCrawlerService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    /**
     * Check robots.txt politeness rule before crawling.
     */
    public boolean isAllowedByRobots(String targetUrl) {
        try {
            URI uri = new URI(targetUrl);
            String host = uri.getHost();
            if (host == null) return false;

            // Enforce basic robots.txt exclusion rules for common admin/private paths
            String path = uri.getPath();
            if (path != null && (path.startsWith("/admin") || path.startsWith("/private") || path.startsWith("/api/internal"))) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Enforce per-domain crawl delay (politeness).
     */
    private void enforcePoliteness(String domain) {
        Long last = domainLastVisit.get(domain);
        long now = System.currentTimeMillis();
        if (last != null) {
            long elapsed = now - last;
            if (elapsed < politenessDelayMs) {
                try {
                    Thread.sleep(politenessDelayMs - elapsed);
                } catch (InterruptedException ignored) {}
            }
        }
        domainLastVisit.put(domain, System.currentTimeMillis());
    }

    /**
     * Crawl a single target URL politely and index into database.
     */
    @Async
    public void crawlAndIndex(String targetUrl, int depthRemaining) {
        if (depthRemaining < 0 || !isAllowedByRobots(targetUrl)) {
            return;
        }

        try {
            URI uri = new URI(targetUrl);
            String domain = uri.getHost();
            if (domain == null) return;

            enforcePoliteness(domain);

            log.info("Crawling polite target: {}", targetUrl);
            Document doc = Jsoup.connect(targetUrl)
                    .userAgent(userAgent)
                    .timeout(5000)
                    .get();

            String title = doc.title();
            if (title == null || title.isBlank()) title = targetUrl;

            // Extract meta description or first paragraph for snippet
            Element metaDesc = doc.selectFirst("meta[name=description]");
            String snippet = metaDesc != null ? metaDesc.attr("content") : "";
            if (snippet.isBlank()) {
                Element firstP = doc.selectFirst("p");
                snippet = firstP != null ? firstP.text() : "";
            }
            if (snippet.length() > 300) {
                snippet = snippet.substring(0, 300) + "...";
            }

            // Extract main text content, limiting to 5000 chars for indexing
            String bodyText = doc.body().text();
            if (bodyText.length() > 5000) {
                bodyText = bodyText.substring(0, 5000);
            }

            String docId = UUID.nameUUIDFromBytes(targetUrl.getBytes()).toString();
            DocumentEntity entity = new DocumentEntity(docId, targetUrl, title, snippet, bodyText, domain);
            documentRepository.save(entity);
            log.info("Indexed document: [{}] - {}", docId, title);

            // Follow internal links if depth permits
            if (depthRemaining > 0) {
                Elements links = doc.select("a[href]");
                int followed = 0;
                for (Element link : links) {
                    if (followed >= 5) break; // polite limit of 5 sublinks per page
                    String href = link.absUrl("href");
                    if (href.startsWith("http") && href.contains(domain)) {
                        crawlAndIndex(href, depthRemaining - 1);
                        followed++;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to crawl {}: {}", targetUrl, e.getMessage());
        }
    }
}
