import test from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_CHAT = "http://chat.test";
const { chatService } = await import("../src/utils/chatService.js");

test("sendMessageStream hands onError the Error with .status so the widget can refresh on 401", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 401, statusText: "Unauthorized" });
  try {
    let received = "not-called";
    await chatService.sendMessageStream("hi", "thread-1", {}, () => {}, (e) => {
      received = e;
    }, "expired-token");
    assert.ok(received instanceof Error, `expected an Error, got ${typeof received}: ${received}`);
    assert.equal(received.status, 401);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("sendMessage rejects with .status on a non-ok response", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 401, statusText: "Unauthorized" });
  try {
    await assert.rejects(() => chatService.sendMessage("hi", "thread-1"), (err) => err.status === 401);
  } finally {
    globalThis.fetch = realFetch;
  }
});
