import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for a small
  // production Docker image.
  output: "standalone",
  // Allow any LAN device (phones/tablets on wifi) to hit dev HMR resources.
  // Next rejects a bare "*", so match all IPv4 hosts. ponytail: IPv4-only;
  // add a hostname pattern here if you test from a *.local machine name.
  allowedDevOrigins: ["*.*.*.*"],
};

export default nextConfig;
