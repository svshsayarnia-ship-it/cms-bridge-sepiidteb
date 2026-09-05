import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  async redirects() {
    return [
      {
        source: "/product/profhilo",
        destination: "/shop/skin-boosters",
        permanent: true,
      },
      {
        source: "/product/neuramis-volume-lidocaine",
        destination: "/product/neuramis-deep-lidocaine",
        permanent: true,
      },
      {
        source: "/product/neuramis-lidocaine",
        destination: "/product/neuramis-deep-lidocaine",
        permanent: true,
      },
      {
        source: "/product/revofil-ultra-2",
        destination: "/product/revofil-ultra",
        permanent: true,
      },
      {
        source: "/product/audrey-h",
        destination: "/product/audrey-m",
        permanent: true,
      },
      {
        source: "/product/dimono-3ml",
        destination: "/product/cg-dimono-ptx",
        permanent: true,
      },
      {
        source: "/product/dimono-mesotherapy",
        destination: "/product/cg-dimono-ptx",
        permanent: true,
      },
      {
        source: "/product/luxiva",
        destination: "/product/luxiva-mesogel",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
