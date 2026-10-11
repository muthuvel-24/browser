package com.muthu.browser.search.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RobotsTxtParserTest {

    @Test
    void testPrefixMatching() {
        assertTrue(RobotsTxtParser.pathMatches("/admin/users", "/admin"));
        assertTrue(RobotsTxtParser.pathMatches("/admin", "/admin"));
        assertFalse(RobotsTxtParser.pathMatches("/public/page", "/admin"));
    }

    @Test
    void testWildcardPatternMatching() {
        // Pattern with * wildcard
        assertTrue(RobotsTxtParser.pathMatches("/fish/salmon/index.html", "/fish*"));
        assertTrue(RobotsTxtParser.pathMatches("/fish.php", "/fish*.php"));
        assertTrue(RobotsTxtParser.pathMatches("/fish_dinner.php", "/fish*.php"));
        assertFalse(RobotsTxtParser.pathMatches("/fish_dinner.html", "/fish*.php"));

        assertTrue(RobotsTxtParser.pathMatches("/articles/2026/print", "/articles/*/print"));
        assertFalse(RobotsTxtParser.pathMatches("/articles/2026/view", "/articles/*/print"));
    }

    @Test
    void testEndAnchorMatching() {
        // Pattern with $ end anchor
        assertTrue(RobotsTxtParser.pathMatches("/image.gif", "/*.gif$"));
        assertTrue(RobotsTxtParser.pathMatches("/assets/logo.gif", "/*.gif$"));
        assertFalse(RobotsTxtParser.pathMatches("/image.gif.bak", "/*.gif$"));
        assertFalse(RobotsTxtParser.pathMatches("/image.gif?v=2", "/*.gif$"));

        assertTrue(RobotsTxtParser.pathMatches("/exact", "/exact$"));
        assertFalse(RobotsTxtParser.pathMatches("/exact/child", "/exact$"));
    }

    @Test
    void testEmptyAndRootPatterns() {
        assertFalse(RobotsTxtParser.pathMatches("/anything", ""));
        assertFalse(RobotsTxtParser.pathMatches("/anything", null));
        assertTrue(RobotsTxtParser.pathMatches("/anything", "/"));
    }
}
