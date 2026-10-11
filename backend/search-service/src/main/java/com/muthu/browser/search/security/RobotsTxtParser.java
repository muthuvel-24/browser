package com.muthu.browser.search.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fetches, parses, and caches robots.txt files per domain in compliance with RFC 9309.
 * Honors User-agent group selection (preferring specific product token over wildcard '*'),
 * Allow and Disallow directives, wildcard pattern matching ('*'), end-of-path anchors ('$'),
 * Crawl-delay directives, and HTTP status codes (2xx, 4xx allow-all, 5xx disallow-all).
 */
@Component
public class RobotsTxtParser {

    private static final Logger log = LoggerFactory.getLogger(RobotsTxtParser.class);

    private final SafeUrlValidator safeUrlValidator;
    private final SafeHttpConnector safeHttpConnector;
    private final Map<String, DomainRobotsPolicy> cache = new ConcurrentHashMap<>();

    public RobotsTxtParser(SafeUrlValidator safeUrlValidator, SafeHttpConnector safeHttpConnector) {
        this.safeUrlValidator = safeUrlValidator;
        this.safeHttpConnector = safeHttpConnector;
    }

    public static class DomainRobotsPolicy {
        public final List<String> disallows = new ArrayList<>();
        public final List<String> allows = new ArrayList<>();
        public long crawlDelaySeconds = 0;
        public final long fetchedTimestamp = System.currentTimeMillis();
    }

    private static class RobotsGroup {
        final List<String> userAgents = new ArrayList<>();
        final List<String> allows = new ArrayList<>();
        final List<String> disallows = new ArrayList<>();
        long crawlDelaySeconds = 0;
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
                // If policy cannot be determined, default to allowed
                return true;
            }

            // Longest matching rule wins between Allow and Disallow per RFC 9309 section 2.2.2
            String matchedAllow = findLongestMatch(path, policy.allows);
            String matchedDisallow = findLongestMatch(path, policy.disallows);

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

    private String findLongestMatch(String path, List<String> patterns) {
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

    /**
     * Evaluates whether a URL path matches a robots.txt pattern containing
     * optional wildcard '*' and end-anchor '$' characters.
     */
    public static boolean pathMatches(String path, String pattern) {
        if (pattern == null || pattern.isEmpty()) {
            return false;
        }

        // Fast path: literal prefix check if no special characters
        if (!pattern.contains("*") && !pattern.endsWith("$")) {
            return path.startsWith(pattern);
        }

        StringBuilder regex = new StringBuilder("^");
        int len = pattern.length();
        boolean hasEndAnchor = pattern.endsWith("$");
        int endLimit = hasEndAnchor ? len - 1 : len;

        for (int i = 0; i < endLimit; i++) {
            char c = pattern.charAt(i);
            if (c == '*') {
                regex.append(".*");
            } else if ("\\.[]{}()+-?^|".indexOf(c) != -1) {
                regex.append('\\').append(c);
            } else {
                regex.append(c);
            }
        }

        if (hasEndAnchor) {
            regex.append("$");
        } else {
            regex.append(".*");
        }

        try {
            return path.matches(regex.toString());
        } catch (Exception e) {
            return path.startsWith(pattern);
        }
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
            // Fetch safely using DNS-rebinding immune connection
            conn = safeHttpConnector.openSafeConnection(robotsUrl, userAgent, 3000);

            int code = conn.getResponseCode();
            if (code >= 400 && code < 500) {
                // 4xx: robots.txt does not exist or access denied -> allow all per RFC 9309
                return new DomainRobotsPolicy();
            }
            if (code >= 500 && code < 600) {
                // 5xx: Server error -> fail closed (disallow all) to avoid overwhelming failing server
                DomainRobotsPolicy failClosed = new DomainRobotsPolicy();
                failClosed.disallows.add("/");
                return failClosed;
            }
            if (code < 200 || code >= 300) {
                return new DomainRobotsPolicy();
            }

            List<RobotsGroup> groups = new ArrayList<>();
            RobotsGroup currentGroup = null;
            boolean inDirectives = false;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;

                    int colonIdx = line.indexOf(':');
                    if (colonIdx == -1) continue;

                    String directive = line.substring(0, colonIdx).trim().toLowerCase();
                    String value = line.substring(colonIdx + 1).trim();

                    if ("user-agent".equals(directive)) {
                        String agentToken = value.toLowerCase();
                        if (inDirectives || currentGroup == null) {
                            currentGroup = new RobotsGroup();
                            groups.add(currentGroup);
                            inDirectives = false;
                        }
                        currentGroup.userAgents.add(agentToken);
                    } else if (currentGroup != null) {
                        inDirectives = true;
                        if ("disallow".equals(directive) && !value.isEmpty()) {
                            currentGroup.disallows.add(value);
                        } else if ("allow".equals(directive) && !value.isEmpty()) {
                            currentGroup.allows.add(value);
                        } else if ("crawl-delay".equals(directive)) {
                            try {
                                currentGroup.crawlDelaySeconds = Long.parseLong(value);
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                }
            }

            // Find group matching our user-agent (exact token / substring), or wildcard '*'
            String normalizedAgent = userAgent.toLowerCase();
            RobotsGroup selectedGroup = null;

            // 1. Specific product token group check
            for (RobotsGroup g : groups) {
                for (String token : g.userAgents) {
                    if (!"*".equals(token) && normalizedAgent.contains(token)) {
                        selectedGroup = g;
                        break;
                    }
                }
                if (selectedGroup != null) break;
            }

            // 2. Wildcard group fallback
            if (selectedGroup == null) {
                for (RobotsGroup g : groups) {
                    if (g.userAgents.contains("*")) {
                        selectedGroup = g;
                        break;
                    }
                }
            }

            DomainRobotsPolicy policy = new DomainRobotsPolicy();
            if (selectedGroup != null) {
                policy.allows.addAll(selectedGroup.allows);
                policy.disallows.addAll(selectedGroup.disallows);
                policy.crawlDelaySeconds = selectedGroup.crawlDelaySeconds;
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
