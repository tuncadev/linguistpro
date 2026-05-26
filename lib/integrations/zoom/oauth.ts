export type ZoomTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
};

export type ZoomUserProfile = {
  id: string;
  account_id?: string;
  email?: string;
};

export function getZoomOAuthConfig() {
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  const redirectUri = process.env.ZOOM_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Zoom OAuth credentials are not configured");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

function buildBasicAuthHeader(clientId: string, clientSecret: string) {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${token}`;
}

export function buildZoomOAuthUrl(state?: string) {
  const { clientId, redirectUri } = getZoomOAuthConfig();
  const url = new URL("https://zoom.us/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}

export async function exchangeZoomAuthCode(code: string): Promise<ZoomTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getZoomOAuthConfig();
  const url = new URL("https://zoom.us/oauth/token");
  url.searchParams.set("grant_type", "authorization_code");
  url.searchParams.set("code", code);
  url.searchParams.set("redirect_uri", redirectUri);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: buildBasicAuthHeader(clientId, clientSecret),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoom token exchange failed (${response.status}): ${body.slice(0, 400)}`);
  }

  return (await response.json()) as ZoomTokenResponse;
}

export async function refreshZoomToken(refreshToken: string): Promise<ZoomTokenResponse> {
  const { clientId, clientSecret } = getZoomOAuthConfig();
  const url = new URL("https://zoom.us/oauth/token");
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("refresh_token", refreshToken);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: buildBasicAuthHeader(clientId, clientSecret),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoom token refresh failed (${response.status}): ${body.slice(0, 400)}`);
  }

  return (await response.json()) as ZoomTokenResponse;
}

export async function fetchZoomUserProfile(accessToken: string): Promise<ZoomUserProfile> {
  const response = await fetch("https://api.zoom.us/v2/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoom profile fetch failed (${response.status}): ${body.slice(0, 400)}`);
  }

  return (await response.json()) as ZoomUserProfile;
}
