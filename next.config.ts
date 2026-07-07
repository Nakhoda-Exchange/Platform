import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // Baked into the client bundle at build so the app can log which build is
  // running (see components/layout/build-info-logger.tsx). Commit sha comes
  // from Vercel's build env; "dev" locally.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  // Self-contained server bundle (.next/standalone) for a small production
  // Docker image. Off on Vercel: it does its own file tracing and standalone's
  // .nft.json step breaks the build (ENOENT next-server.js.nft.json).
  output: process.env.VERCEL ? undefined : "standalone",
  // Allow any LAN device (phones/tablets on wifi) to hit dev HMR resources.
  // Next rejects a bare "*", so match all IPv4 hosts. ponytail: IPv4-only;
  // add a hostname pattern here if you test from a *.local machine name.
  allowedDevOrigins: ["*.*.*.*"],
};

export default nextConfig;
