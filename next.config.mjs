/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // `ws` (used by the Neon serverless driver adapter) breaks when webpack
  // bundles it — its internal frame-masking code ends up mismatched
  // (`b.mask is not a function`). serverExternalPackages alone didn't stop
  // it being bundled, so force it via webpack's own externals too.
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("ws", "bufferutil", "utf-8-validate");
    }
    return config;
  },
  // Constrained shared hosting can hit its process-count limit when the
  // build spawns multiple worker processes for type-checking/compilation
  // in parallel (shows up as `spawn ... EAGAIN`). Capping at 1 avoids that.
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
