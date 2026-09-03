// next build's "standalone" output intentionally omits .next/static and
// public/ (see https://nextjs.org/docs/pages/api-reference/config/next-config-js/output).
// This copies them in so `.next/standalone/server.js` is a fully
// self-contained server you can run from anywhere with just `node server.js`.
import { cpSync, existsSync } from "node:fs";
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

console.log("Copied static assets into .next/standalone.");
