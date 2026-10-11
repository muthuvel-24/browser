package com.muthu.browser.search.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fetches, parses, and caches robots.txt files per domain.
 * Honors User-agent matching (custom or wildcard '*'), Disallow / Allow rules,
 * and Crawl-delay directives.
 */
@Component
public class RobotsTxtParser {

    private static final Logger log = LoggerFactory.getLogger(RobotsTxtParser.class);

    private final SafeUrlValidator safeUrlValidator;
    private final Map<String, DomainRobotsPolicy> cache = new ConcurrentHashMap<>();

    public RobotsTxtParser(SafeUrlValidator safeUrlValidator) {
        this.safeUrlValidator = safeUrlValidator;
    }

    public static class DomainRobotsPolicy {
        public final List<String> disallows = new ArrayList<>();
        public final List<String> allows = new ArrayList<>();
        public long crawlDelaySeconds = 0;
        public final long fetchedTimestamp = System.currentTimeMillis();
    }

    /**
     * Determines whether targetUrl is allowed by the host's robots.txt.
     */
    public boolean isAllowed(String targetUrl, String userAgent) {
        try {
            URI uri = safeUrlValidator.validateAndResolve(targetUrl);
            String domain = uri.getHost().toLowerCase();
            String path = uri.getRawPath();
            if (path == null || path.isBlank()) {
                path = "/";
            }

            DomainRobotsPolicy policy = getPolicyForDomain(uri, userAgent);
            if (policy == null) {
                // If robots.txt cannot be fetched (e.g. 404), default to allowed
                return true;
            }

            // Longest matching rule wins between Allow and Disallow
            String matchedAllow = findLongestPrefixMatch(path, policy.allows);
            String matchedDisallow = findLongestPrefixMatch(path, policy.disallows);

            if (matchedDisallow == null) {
                return true;
            }
            if (matchedAllow != null && matchedAllow.length() >= matchedDisallow.length()) {
                return true;
            }

            log.info("Path {} disallowed by robots.txt rule [{}] on domain {}", path, matchedDisallow, domain);
            return false;
        } catch (Exception e) {
            log.warn("Robots check failed for {}: {}", targetUrl, e.getMessage());
            return false;
        }
    }

    public long getCrawlDelaySeconds(String targetUrl, String userAgent) {
        try {
            URI uri = safeUrlValidator.validateAndResolve(targetUrl);
            DomainRobotsPolicy policy = getPolicyForDomain(uri, userAgent);
            return policy != null ? policy.crawlDelaySeconds : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private String findLongestPrefixMatch(String path, List<String> patterns) {
        String longest = null;
        for (String pattern : patterns) {
            if (pathMatches(path, pattern)) {
                if (longest == null || pattern.length() > longest.length()) {
                    longest = pattern;
                }
            }
        }
        return longest;
    }

    private boolean pathMatches(String path, String pattern) {
        if (pattern.isEmpty()) return false;
        if (pattern.endsWith("$")) {
            String prefix = pattern.substring(0, pattern.length() - 1);
            return path.equals(prefix);
        }
        return path.startsWith(pattern);
    }

    private DomainRobotsPolicy getPolicyForDomain(URI uri, String userAgent) {
        String domainKey = uri.getScheme().toLowerCase() + "://" + uri.getHost().toLowerCase() +
                (uri.getPort() != -1 && uri.getPort() != 80 && uri.getPort() != 443 ? ":" + uri.getPort() : "");

        DomainRobotsPolicy cached = cache.get(domainKey);
        // Cache valid for 1 hour (3600000 ms)
        if (cached != null && (System.currentTimeMillis() - cached.fetchedTimestamp) < 3600_000L) {
            return cached;
        }

        DomainRobotsPolicy policy = fetchAndParseRobots(domainKey, userAgent);
        if (policy != null) {
            cache.put(domainKey, policy);
        }
        return policy;
    }

    private DomainRobotsPolicy fetchAndParseRobots(String domainKey, String userAgent) {
        String robotsUrl = domainKey + "/robots.txt";
        HttpURLConnection conn = null;
        try {
            URI safeUri = safeUrlValidator.validateAndResolve(robotsUrl);
            URL url = safeUri.toURL();
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false); // Do not follow redirects automatically
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.setRequestProperty("User-Agent", userAgent);

            int code = conn.getResponseCode();
            if (code == 404 || code == 410) {
                // Robots not present -> all allowed
                return new DomainRobotsPolicy();
            }
            if (code < 200 || code >= 300) {
                // Server error / redirect -> fail closed or safe default
                return new DomainRobotsPolicy();
            }

            DomainRobotsPolicy policy = new DomainRobotsPolicy();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean appliesToMe = false;
                String normalizedAgent = userAgent.toLowerCase();

                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;

                    int colonIdx = line.indexOf(':');
                    if (colonIdx == -1) continue;

                    String directive = line.substring(0, colonIdx).trim().toLowerCase();
                    String value = line.substring(colonIdx + 1).trim();

                    if ("user-agent".equals(directive)) {
                        String agentToken = value.toLowerCase();
                        appliesToMe = "*".equals(agentToken) || normalizedAgent.contains(agentToken);
                    } else if (appliesToMe) {
                        if ("disallow".equals(directive) && !value.isEmpty()) {
                            policy.disallows.add(value);
                        } else if ("allow".equals(directive) && !value.isEmpty()) {
                            policy.allows.add(value);
                        } else if ("crawl-delay".equals(directive)) {
                            try {
                                policy.crawlDelaySeconds = Long.parseLong(value);
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                }
            }
            return policy;
        } catch (Exception e) {
            log.debug("Unable to fetch robots.txt for {}: {}", robotsUrl, e.getMessage());
            return new DomainRobotsPolicy();
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
