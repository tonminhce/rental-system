import test from "node:test";
import assert from "node:assert/strict";
import { withReauthentication } from "../src/redux/reauthQuery.mjs";

const actions = { setUserInfo: (payload) => ({ type: "set", payload }), removeUserInfo: () => ({ type: "remove" }) };
const expired = { error: { status: 401, data: { code: "TOKEN_EXPIRED" } } };
function fixture() {
  const state = { auth: { accessToken: "old", refreshToken: "refresh", user: { id: 1 } } };
  const api = {
    getState: () => state,
    dispatch(action) {
      if (action.type === "set")
        state.auth = { ...state.auth, accessToken: action.payload.token, refreshToken: action.payload.refreshToken };
      else state.auth = {};
    },
  };
  return { state, api };
}
test("concurrent expired requests use one refresh and both retry", async () => {
  const { api, state } = fixture();
  let refreshes = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const query = withReauthentication(async (args) => {
    if (args.url === "/auth/refresh-token") {
      refreshes++;
      await gate;
      return { data: { data: { token: "new", refreshToken: "new-refresh" } } };
    }
    return state.auth.accessToken === "old" ? expired : { data: "ok" };
  }, actions);
  const pending = [query({ url: "/roommate/profile/me" }, api), query({ url: "/roommate/suggestions" }, api)];
  release();
  const results = await Promise.all(pending);
  assert.equal(refreshes, 1);
  assert.deepEqual(results, [{ data: "ok" }, { data: "ok" }]);
});
test("a network failure keeps the session for a later retry", async () => {
  const { api, state } = fixture();
  const query = withReauthentication(
    async (args) => (args.url === "/auth/refresh-token" ? { error: { status: "FETCH_ERROR" } } : expired),
    actions,
  );
  await query("/roommate/profile/me", api);
  assert.equal(state.auth.refreshToken, "refresh");
});
test("a non-expiry 401 clears the session and redirects to login", async () => {
  const { api, state } = fixture();
  const redirected = [];
  globalThis.window = { location: { pathname: "/rent", search: "?q=1", assign: (u) => redirected.push(u) } };
  try {
    const revoked = { error: { status: 401, data: { code: "TOKEN_REVOKED" } } };
    const query = withReauthentication(async () => revoked, actions);
    const result = await query({ url: "/roommate/profile/me" }, api);
    assert.deepEqual(state.auth, {});
    assert.deepEqual(redirected, ["/login?returnURL=%2Frent%3Fq%3D1"]);
    assert.equal(result.error.status, 401);
    // A 401 from the auth endpoints themselves (e.g. bad password) must not bounce the login page.
    await query({ url: "/auth/login" }, api);
    assert.equal(redirected.length, 1);
  } finally {
    delete globalThis.window;
  }
});
test("logout with an expired access token refreshes and retries so the server revoke lands", async () => {
  const { api, state } = fixture();
  const calls = [];
  const query = withReauthentication(async (args, a) => {
    const url = typeof args === "string" ? args : args.url;
    calls.push(args?.body?.refreshToken ? `${url} rt=${args.body.refreshToken}` : url);
    if (url === "/auth/refresh-token") return { data: { data: { token: "new", refreshToken: "new-refresh" } } };
    return state.auth.accessToken === "old" ? expired : { data: { ok: true } };
  }, actions);
  const result = await query({ url: "/auth/logout", method: "POST", body: { refreshToken: "refresh" } }, api);
  assert.deepEqual(result, { data: { ok: true } });
  // The retried logout must carry the ROTATED refresh token — replaying the
  // stale one would revoke an already-dead row and leave the live one valid.
  assert.deepEqual(calls, ["/auth/logout rt=refresh", "/auth/refresh-token rt=refresh", "/auth/logout rt=new-refresh"]);
});
test("refresh cannot sign a user back in after logout", async () => {
  const { api, state } = fixture();
  const query = withReauthentication(async (args) => {
    if (args.url === "/auth/refresh-token") {
      state.auth = {};
      return { data: { data: { token: "new", refreshToken: "new-refresh" } } };
    }
    return expired;
  }, actions);
  await query("/roommate/profile/me", api);
  assert.deepEqual(state.auth, {});
});
