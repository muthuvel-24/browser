package com.muthu.browser.search.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.*;
import java.util.Arrays;
import java.util.Set;

/**
 * Validates URLs and destination IP addresses against Server-Side Request Forgery (SSRF),
 * DNS rebinding, cloud metadata exfiltration, and internal intranet reconnaissance.
 */
@Component
public class SafeUrlValidator {

    private static final Logger log = LoggerFactory.getLogger(SafeUrlValidator.class);

    private static final Set<String> FORBIDDEN_HOSTNAMES = Set.of(
            "localhost",
            "localhost.localdomain",
            "metadata.google.internal",
            "instance-data"
    );

    private static final Set<String> CLOUD_METADATA_IPS = Set.of(
            "169.254.169.254",
            "169.254.169.253",
            "100.100.100.200"
    );

    /**
     * Validate URL syntax, scheme, port, userinfo, and resolved IP addresses.
     * Throws SecurityException if the target is unsafe.
     */
    public URI validateAndResolve(String urlString) {
        if (urlString == null || urlString.isBlank()) {
            throw new SecurityException("Target URL cannot be empty");
        }

        if (urlString.length() > 2048) {
            throw new SecurityException("Target URL exceeds maximum length of 2048 characters");
        }

        URI uri;
        try {
            uri = new URI(urlString.trim());
        } catch (URISyntaxException e) {
            throw new SecurityException("Invalid URL syntax: " + e.getMessage());
        }

        // 1. Strict scheme check (only HTTP and HTTPS)
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new SecurityException("Unsupported scheme: " + scheme + ". Only http and https are allowed.");
        }

        // 2. Reject user information in URL (e.g., http://user:pass@host)
        if (uri.getUserInfo() != null) {
            throw new SecurityException("URLs with userinfo credentials are not permitted.");
        }

        // 3. Port restrictions (only standard 80, 443, or default allowed)
        int port = uri.getPort();
        if (port != -1 && port != 80 && port != 443) {
            throw new SecurityException("Non-standard port " + port + " is not permitted.");
        }

        // 4. Hostname validation
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new SecurityException("URL must contain a valid hostname");
        }

        String hostLower = host.toLowerCase().trim();
        if (FORBIDDEN_HOSTNAMES.contains(hostLower) ||
            hostLower.endsWith(".local") ||
            hostLower.endsWith(".internal") ||
            hostLower.endsWith(".arpa") ||
            hostLower.endsWith(".localhost")) {
            throw new SecurityException("Forbidden host destination: " + hostLower);
        }

        // 5. DNS Resolution and IP filtering
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(hostLower);
        } catch (UnknownHostException e) {
            throw new SecurityException("Unable to resolve hostname: " + hostLower);
        }

        if (addresses == null || addresses.length == 0) {
            throw new SecurityException("Host resolved to no IP addresses: " + hostLower);
        }

        for (InetAddress addr : addresses) {
            validateAddress(addr, hostLower);
        }

        return uri;
    }

    public static class SafeTarget {
        private final URI uri;
        private final InetAddress address;
        private final String originalHost;
        private final int port;

        public SafeTarget(URI uri, InetAddress address, String originalHost, int port) {
            this.uri = uri;
            this.address = address;
            this.originalHost = originalHost;
            this.port = port;
        }

        public URI getUri() { return uri; }
        public InetAddress getAddress() { return address; }
        public String getOriginalHost() { return originalHost; }
        public int getPort() { return port; }
    }

    /**
     * Validates URL and returns a pinned IP address target for DNS-rebinding safe HTTP connections.
     */
    public SafeTarget validateAndPin(String urlString) {
        URI uri = validateAndResolve(urlString);
        String hostLower = uri.getHost().toLowerCase().trim();
        try {
            InetAddress[] addresses = InetAddress.getAllByName(hostLower);
            if (addresses == null || addresses.length == 0) {
                throw new SecurityException("Host resolved to no IP addresses: " + hostLower);
            }
            for (InetAddress addr : addresses) {
                validateAddress(addr, hostLower);
            }
            return new SafeTarget(uri, addresses[0], hostLower, uri.getPort());
        } catch (UnknownHostException e) {
            throw new SecurityException("Unable to resolve hostname: " + hostLower);
        }
    }

    /**
     * Inspect an IP address against loopback, private, link-local, multicast, metadata, and IPv6 ranges.
     */
    public void validateAddress(InetAddress addr, String host) {
        // Loopback (127.0.0.0/8, ::1)
        if (addr.isLoopbackAddress()) {
            throw new SecurityException("SSRF Blocked: Destination " + host + " resolved to loopback IP " + addr.getHostAddress());
        }

        // Any local / wildcard (0.0.0.0, ::)
        if (addr.isAnyLocalAddress()) {
            throw new SecurityException("SSRF Blocked: Destination " + host + " resolved to wildcard IP " + addr.getHostAddress());
        }

        // Link-local (169.254.0.0/16, fe80::/10)
        if (addr.isLinkLocalAddress()) {
            throw new SecurityException("SSRF Blocked: Destination " + host + " resolved to link-local IP " + addr.getHostAddress());
        }

        // Site-local / private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
        if (addr.isSiteLocalAddress()) {
            throw new SecurityException("SSRF Blocked: Destination " + host + " resolved to private IP " + addr.getHostAddress());
        }

        // Multicast (224.0.0.0/4, ff00::/8)
        if (addr.isMulticastAddress()) {
            throw new SecurityException("SSRF Blocked: Destination " + host + " resolved to multicast IP " + addr.getHostAddress());
        }

        String ipString = addr.getHostAddress();

        // Cloud metadata destinations
        if (CLOUD_METADATA_IPS.contains(ipString)) {
            throw new SecurityException("SSRF Blocked: Cloud metadata IP " + ipString + " is strictly prohibited.");
        }

        // IPv6 Unique Local (fc00::/7) or metadata (fd00:ec2::254)
        byte[] bytes = addr.getAddress();
        if (bytes.length == 16) {
            int firstByte = bytes[0] & 0xFF;
            if (firstByte == 0xFC || firstByte == 0xFD) {
                throw new SecurityException("SSRF Blocked: IPv6 Unique Local Address " + ipString + " is prohibited.");
            }
        }

        // IPv4-mapped IPv6 (::ffff:127.0.0.1)
        if (addr instanceof Inet6Address) {
            Inet6Address v6 = (Inet6Address) addr;
            if (v6.isIPv4CompatibleAddress()) {
                throw new SecurityException("SSRF Blocked: IPv4-compatible IPv6 addresses are prohibited.");
            }
        }
    }
}
