package com.muthu.browser.search.security;

import org.springframework.stereotype.Component;

import javax.net.ssl.*;
import java.io.IOException;
import java.net.*;
import java.util.List;

/**
 * Provides DNS-rebinding and TOCTOU safe HTTP/HTTPS connections.
 * Pins outbound TCP sockets directly to pre-validated IP addresses,
 * ensuring no secondary DNS lookup occurs between address validation
 * and network connection establishment.
 */
@Component
public class SafeHttpConnector {

    private final SafeUrlValidator validator;

    public SafeHttpConnector(SafeUrlValidator validator) {
        this.validator = validator;
    }

    /**
     * Opens an SSRF-safe HttpURLConnection pinned to the validated IP address.
     */
    public HttpURLConnection openSafeConnection(String targetUrl, String userAgent, int timeoutMs) throws IOException {
        SafeUrlValidator.SafeTarget target = validator.validateAndPin(targetUrl);
        boolean isHttps = target.getUri().getScheme().equalsIgnoreCase("https");
        int effectivePort = target.getPort() != -1 ? target.getPort() : (isHttps ? 443 : 80);

        HttpURLConnection conn;

        if (isHttps) {
            // For HTTPS: connect to original host URL, but pin underlying TCP socket via custom SSLSocketFactory
            URL url = target.getUri().toURL();
            HttpsURLConnection httpsConn = (HttpsURLConnection) url.openConnection();
            httpsConn.setSSLSocketFactory(new PinnedSSLSocketFactory(target.getAddress(), target.getOriginalHost()));
            httpsConn.setHostnameVerifier((hostname, session) ->
                    HttpsURLConnection.getDefaultHostnameVerifier().verify(target.getOriginalHost(), session)
            );
            conn = httpsConn;
        } else {
            // For HTTP: connect to the validated IP directly so HttpURLConnection cannot perform DNS resolution
            String pathAndQuery = (target.getUri().getRawPath() == null || target.getUri().getRawPath().isEmpty())
                    ? "/"
                    : target.getUri().getRawPath();
            if (target.getUri().getRawQuery() != null) {
                pathAndQuery += "?" + target.getUri().getRawQuery();
            }
            URL ipUrl = new URL("http", target.getAddress().getHostAddress(), effectivePort, pathAndQuery);
            conn = (HttpURLConnection) ipUrl.openConnection();
            String hostHeader = target.getOriginalHost() + (target.getPort() != -1 && target.getPort() != 80 ? ":" + target.getPort() : "");
            conn.setRequestProperty("Host", hostHeader);
        }

        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(timeoutMs);
        conn.setReadTimeout(timeoutMs);
        if (userAgent != null) {
            conn.setRequestProperty("User-Agent", userAgent);
        }
        return conn;
    }

    /**
     * Custom SSLSocketFactory that connects TCP sockets directly to a pre-validated IP address,
     * while preserving TLS SNI and certificate hostname verification.
     */
    private static class PinnedSSLSocketFactory extends SSLSocketFactory {
        private final SSLSocketFactory delegate;
        private final InetAddress pinnedAddress;
        private final String originalHost;

        public PinnedSSLSocketFactory(InetAddress pinnedAddress, String originalHost) {
            this.pinnedAddress = pinnedAddress;
            this.originalHost = originalHost;
            this.delegate = (SSLSocketFactory) SSLSocketFactory.getDefault();
        }

        @Override
        public String[] getDefaultCipherSuites() {
            return delegate.getDefaultCipherSuites();
        }

        @Override
        public String[] getSupportedCipherSuites() {
            return delegate.getSupportedCipherSuites();
        }

        @Override
        public Socket createSocket(Socket s, String host, int port, boolean autoClose) throws IOException {
            return delegate.createSocket(s, host, port, autoClose);
        }

        @Override
        public Socket createSocket(String host, int port) throws IOException {
            Socket socket = delegate.createSocket(pinnedAddress, port);
            configureSni(socket);
            return socket;
        }

        @Override
        public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
            Socket socket = delegate.createSocket(pinnedAddress, port, localHost, localPort);
            configureSni(socket);
            return socket;
        }

        @Override
        public Socket createSocket(InetAddress host, int port) throws IOException {
            Socket socket = delegate.createSocket(pinnedAddress, port);
            configureSni(socket);
            return socket;
        }

        @Override
        public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort) throws IOException {
            Socket socket = delegate.createSocket(pinnedAddress, port, localAddress, localPort);
            configureSni(socket);
            return socket;
        }

        private void configureSni(Socket socket) {
            if (socket instanceof SSLSocket) {
                SSLSocket ssl = (SSLSocket) socket;
                SSLParameters params = ssl.getSSLParameters();
                params.setServerNames(List.of(new SNIHostName(originalHost)));
                ssl.setSSLParameters(params);
            }
        }
    }
}
