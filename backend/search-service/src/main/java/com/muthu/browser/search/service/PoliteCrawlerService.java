package com.muthu.browser.search.service;

import com.muthu.browser.search.model.DocumentEntity;
import com.muthu.browser.search.repository.DocumentRepository;
import com.muthu.browser.search.security.RobotsTxtParser;
import com.muthu.browser.search.security.SafeHttpConnector;
import com.muthu.browser.search.security.SafeUrlValidator;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PoliteCrawlerService {

    private static final Logger log = LoggerFactory.getLogger(PoliteCrawlerService.class);
    private static final int MAX_PAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    private static final int MAX_REDIRECTS = 3;

    private final DocumentRepository documentRepository;
    private final SafeUrlValidator safeUrlValidator;
    private final SafeHttpConnector safeHttpConnector;
    private final RobotsTxtParser robotsTxtParser;

    private final Map<String, Long> domainLastVisit = new ConcurrentHashMap<>();
    private final Set<String> visitedUrls = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @Value("${crawler.politeness.delay-ms:1000}")
    private long defaultPolitenessDelayMs;

    @Value("${crawler.user-agent:MuthuBrowserBot/1.0}")
    private String userAgent;

    public PoliteCrawlerService(DocumentRepository documentRepository,
                                SafeUrlValidator safeUrlValidator,
                                SafeHttpConnector safeHttpConnector,
                                RobotsTxtParser robotsTxtParser) {
        this.documentRepository = documentRepository;
        this.safeUrlValidator = safeUrlValidator;
        this.safeHttpConnector = safeHttpConnector;
        this.robotsTxtParser = robotsTxtParser;
    }

    /**
     * Check robots.txt politeness rule before crawling, using validated scheme and SSRF protection.
     */
    public boolean isAllowedByRobots(String targetUrl) {
        try {
            safeUrlValidator.validateAndResolve(targetUrl);
            return robotsTxtParser.isAllowed(targetUrl, userAgent);
        } catch (Exception e) {
            log.warn("Target URL validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Enforce per-domain crawl delay (politeness and robots.txt directives).
     */
    private void enforcePoliteness(String domain, long customDelaySeconds) {
        long effectiveDelayMs = Math.max(defaultPolitenessDelayMs, customDelaySeconds * 1000L);
        Long last = domainLastVisit.get(domain);
        long now = System.currentTimeMillis();
        if (last != null) {
            long elapsed = now - last;
            if (elapsed < effectiveDelayMs) {
                try {
                    Thread.sleep(effectiveDelayMs - elapsed);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            }
        }
        domainLastVisit.put(domain, System.currentTimeMillis());
    }

    /**
     * Fetch document safely: handles SSRF validation on redirects and limits body size.
     */
    private String fetchSafely(String initialUrl) throws Exception {
        String currentUrl = initialUrl;
        int redirects = 0;

        while (redirects <= MAX_REDIRECTS) {
            HttpURLConnection conn = safeHttpConnector.openSafeConnection(currentUrl, userAgent, 5000);

            int status = conn.getResponseCode();
            if (status >= 300 && status < 400) {
                String location = conn.getHeaderField("Location");
                conn.disconnect();
                if (location == null || location.isBlank()) {
                    throw new SecurityException("Redirect location missing");
                }
                URI currentUri = new URI(currentUrl);
                URI nextUri = currentUri.resolve(location);
                currentUrl = nextUri.toString();
                // Validate new location upfront
                safeUrlValidator.validateAndResolve(currentUrl);
                redirects++;
                continue;
            }

            if (status != 200) {
                conn.disconnect();
                throw new RuntimeException("HTTP response status: " + status);
            }

            String contentType = conn.getContentType();
            if (contentType != null && !contentType.toLowerCase().contains("text/html") &&
                !contentType.toLowerCase().contains("application/xhtml")) {
                conn.disconnect();
                throw new IllegalArgumentException("Non-HTML content type: " + contentType);
            }

            try (InputStream in = conn.getInputStream();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                int totalBytes = 0;
                while ((bytesRead = in.read(buffer)) != -1) {
                    totalBytes += bytesRead;
                    if (totalBytes > MAX_PAGE_SIZE_BYTES) {
                        throw new IllegalStateException("Response exceeded max page size limit (" + MAX_PAGE_SIZE_BYTES + " bytes)");
                    }
                    out.write(buffer, 0, bytesRead);
                }
                return out.toString(StandardCharsets.UTF_8);
            } finally {
                conn.disconnect();
            }
        }
        throw new SecurityException("Exceeded maximum redirect depth (" + MAX_REDIRECTS + ")");
    }

    /**
     * Crawl a single target URL politely and index into database.
     */
    @Async
    public void crawlAndIndex(String targetUrl, int depthRemaining) {
        if (depthRemaining < 0) {
            return;
        }

        // Deduplicate URLs
        if (!visitedUrls.add(targetUrl)) {
            log.debug("Skipping already visited URL: {}", targetUrl);
            return;
        }

        try {
            URI uri = safeUrlValidator.validateAndResolve(targetUrl);
            String domain = uri.getHost().toLowerCase();

            if (!robotsTxtParser.isAllowed(targetUrl, userAgent)) {
                log.info("Crawling prohibited by robots.txt: {}", targetUrl);
                return;
            }

            long delaySec = robotsTxtParser.getCrawlDelaySeconds(targetUrl, userAgent);
            enforcePoliteness(domain, delaySec);

            log.info("Crawling verified target: {}", targetUrl);
            String html = fetchSafely(targetUrl);
            Document doc = Jsoup.parse(html, targetUrl);

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
            String bodyText = doc.body() != null ? doc.body().text() : "";
            if (bodyText.length() > 5000) {
                bodyText = bodyText.substring(0, 5000);
            }

            String docId = UUID.nameUUIDFromBytes(targetUrl.getBytes(StandardCharsets.UTF_8)).toString();
            DocumentEntity entity = new DocumentEntity(docId, targetUrl, title, snippet, bodyText, domain);
            documentRepository.save(entity);
            log.info("Indexed document: [{}] - {}", docId, title);

            // Follow internal links if depth permits (strictly within same domain)
            if (depthRemaining > 0) {
                Elements links = doc.select("a[href]");
                int followed = 0;
                for (Element link : links) {
                    if (followed >= 5) break; // polite limit of 5 sublinks per page
                    String href = link.absUrl("href");
                    if (href != null && href.startsWith("http")) {
                        try {
                            URI linkUri = new URI(href);
                            if (domain.equalsIgnoreCase(linkUri.getHost())) {
                                crawlAndIndex(href, depthRemaining - 1);
                                followed++;
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to safely crawl {}: {}", targetUrl, e.getMessage());
        }
    }
}
