import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const nextConfig = require("../next.config.js")("phase-production-server");

test("imported Nha Tot photos are allowed without enabling arbitrary hosts", () => {
  const rules = nextConfig.images.remotePatterns;
  assert.ok(rules.some((rule) => rule.hostname === "cdn.chotot.com" && rule.protocol === "https"));
  assert.ok(rules.some((rule) => rule.hostname === "cloud.mogi.vn" && rule.protocol === "https"));
  assert.ok(!rules.some((rule) => ["*", "**"].includes(rule.hostname)));
});
