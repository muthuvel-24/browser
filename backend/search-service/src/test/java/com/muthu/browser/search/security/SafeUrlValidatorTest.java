package com.muthu.browser.search.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;

import static org.junit.jupiter.api.Assertions.*;

class SafeUrlValidatorTest {

    private SafeUrlValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SafeUrlValidator();
    }

    @Test
    void testValidPublicUrls() {
        assertDoesNotThrow(() -> validator.validateAndResolve("https://example.com/test"));
        assertDoesNotThrow(() -> validator.validateAndResolve("http://example.org:80/path?arg=1"));
    }

    @Test
    void testRejectsLoopbackAndPrivateHostnames() {
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://localhost:8080/admin"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://127.0.0.1/"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://127.0.0.1:8080/"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://internal.service.local/"));
    }

    @Test
    void testRejectsCloudMetadataAndLinkLocal() {
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://169.254.169.254/latest/meta-data"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://169.254.169.253/"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://100.100.100.200/"));
    }

    @Test
    void testRejectsUserInfoAndNonStandardPorts() {
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://admin:secret@example.com/"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://example.com:22/"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("http://example.com:3306/"));
    }

    @Test
    void testRejectsNonHttpSchemes() {
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("file:///etc/passwd"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("gopher://example.com/"));
        assertThrows(SecurityException.class, () -> validator.validateAndResolve("ftp://example.com/"));
    }

    @Test
    void testPrivateAddressRanges() throws Exception {
        InetAddress privateV4 = InetAddress.getByName("10.0.0.1");
        assertThrows(SecurityException.class, () -> validator.validateAddress(privateV4, "10.0.0.1"));

        InetAddress loopbackV4 = InetAddress.getByName("127.0.0.1");
        assertThrows(SecurityException.class, () -> validator.validateAddress(loopbackV4, "127.0.0.1"));
    }

    @Test
    void testValidateAndPin() {
        SafeUrlValidator.SafeTarget target = validator.validateAndPin("https://example.com/index.html");
        assertNotNull(target);
        assertNotNull(target.getAddress());
        assertEquals("example.com", target.getOriginalHost());
        assertEquals("https", target.getUri().getScheme());
    }

    @Test
    void testIpv6UniqueLocalAndMapped() throws Exception {
        InetAddress ula = InetAddress.getByName("fc00::1");
        assertThrows(SecurityException.class, () -> validator.validateAddress(ula, "fc00::1"));

        InetAddress ulaFd = InetAddress.getByName("fd00::1");
        assertThrows(SecurityException.class, () -> validator.validateAddress(ulaFd, "fd00::1"));
    }
}
