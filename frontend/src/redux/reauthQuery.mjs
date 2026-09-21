// Share one refresh per Redux store, even when multiple API slices fail together.
export function withReauthentication(baseQuery, actions) {
  const flights = new WeakMap();
  return async (args, api, options) => {
    const before = api.getState().auth.accessToken;
    const result = await baseQuery(args, api, options);
    const url = typeof args === "string" ? args : args.url;
    if (result.error?.status !== 401 || result.error?.data?.code !== "TOKEN_EXPIRED" || url.startsWith("/auth/"))
      return result;
    const session = api.getState().auth;
    if (!session.refreshToken) {
      api.dispatch(actions.removeUserInfo());
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
        if ([400, 401, 403].includes(refreshed.error?.status)) api.dispatch(actions.removeUserInfo());
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
