import type { NextConfig } from "next";

/**
 * JengaPact — Next.js configuration.
 *
 * Security headers follow OWASP secure-headers guidance. The CSP is strict for
 * scripts and objects; images are limited to same-origin unless an explicit
 * media host is configured. `postgres` is kept external to the server bundle so
 * connection pooling behaviour is preserved on long-running hosts.
 */
const isProd = process.env.NODE_ENV === "production";

const imageCdnHost = process.env.IMAGES_CDN_HOST;

// Next.js injects inline bootstrap scripts and Tailwind v4 uses inline style
// variables, so 'unsafe-inline' is required for script/styles. 'unsafe-eval'
// is only allowed in development for React Refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${imageCdnHost ? ` https://${imageCdnHost}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}${
    imageCdnHost ? ` https://${imageCdnHost}` : ""
  }`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageCdnHost
      ? [{ protocol: "https" as const, hostname: imageCdnHost }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
