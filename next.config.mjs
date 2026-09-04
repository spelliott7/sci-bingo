/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Constrained shared hosting can hit its process-count limit when the
  // build spawns multiple worker processes for type-checking/compilation
  // in parallel (shows up as `spawn ... EAGAIN`). Capping at 1 avoids that.
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
