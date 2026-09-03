// next build's "standalone" output intentionally omits .next/static and
// public/ (see https://nextjs.org/docs/pages/api-reference/config/next-config-js/output).
// This copies them in so `.next/standalone/server.js` is a fully
// self-contained server you can run from anywhere with just `node server.js`.
import { copyFileSync, cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("No .next/standalone found — skipping (is output: \"standalone\" set in next.config?).");
  process.exit(0);
}

cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
});

const publicDir = path.join(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });
}

// Next's standalone output doesn't carry .env along either — copy it so the
// server is runnable from that directory alone, without relying on whatever
// launched it (a host's own env-var UI, a cron job, etc.) to supply one.
const envFile = path.join(root, ".env");
if (existsSync(envFile)) {
  copyFileSync(envFile, path.join(standaloneDir, ".env"));
  console.log("Copied .env into .next/standalone.");
}

console.log("Copied static assets into .next/standalone.");
