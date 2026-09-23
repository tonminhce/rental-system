// Share one refresh per Redux store, even when multiple API slices fail together.

// The session is over: clear persisted tokens and force the login screen.
function endSession(api, removeUserInfo) {
  api.dispatch(removeUserInfo());
  // ponytail: full-page redirect; swap for next/navigation routing if SPA state must survive a forced logout
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign(
      `/login?returnURL=${encodeURIComponent(window.location.pathname + window.location.search)}`,
    );
  }
}

export function withReauthentication(baseQuery, actions) {
  const flights = new WeakMap();
  return async (args, api, options) => {
    const before = api.getState().auth.accessToken;
    const result = await baseQuery(args, api, options);
    const url = typeof args === "string" ? args : args.url;
    // Only login/signup/refresh-token can't be re-authenticated. Logout and
    // change-password MUST refresh-then-retry, or an expired access token
    // leaves the refresh token valid server-side after "logout".
    if (
      result.error?.status !== 401 ||
      ["/auth/login", "/auth/signup", "/auth/refresh-token"].some((p) => url.startsWith(p))
    )
      return result;
    // A non-expiry 401 (revoked token, deleted account) can never refresh —
    // end the session instead of leaving a zombie that 401s forever.
    if (result.error?.data?.code !== "TOKEN_EXPIRED") {
      endSession(api, actions.removeUserInfo);
      return result;
    }
    const session = api.getState().auth;
    if (!session.refreshToken) {
      endSession(api, actions.removeUserInfo);
      return result;
    }
    if (before !== session.accessToken) return baseQuery(args, api, options);
    let flight = flights.get(api.dispatch);
    if (!flight) {
      const refreshToken = session.refreshToken;
      flight = (async () => {
        const refreshed = await baseQuery(
          { url: "/auth/refresh-token", method: "POST", body: { refreshToken } },
          api,
          options,
        );
        // Never restore a session after the user has signed out/switched accounts.
        if (api.getState().auth.refreshToken !== refreshToken) return false;
        if (refreshed.data?.data?.token && refreshed.data?.data?.refreshToken) {
          api.dispatch(actions.setUserInfo({ ...refreshed.data.data, user: api.getState().auth.user }));
          return true;
        }
        if ([400, 401, 403].includes(refreshed.error?.status)) endSession(api, actions.removeUserInfo);
        return false; // A temporary network outage must not erase the session.
      })();
      flights.set(api.dispatch, flight);
    }
    try {
      return (await flight) ? baseQuery(args, api, options) : result;
    } finally {
      if (flights.get(api.dispatch) === flight) flights.delete(api.dispatch);
    }
  };
}
