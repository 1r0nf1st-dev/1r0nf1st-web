import { config } from '../config.js';

const STRAVA_OAUTH = 'https://www.strava.com/oauth';
const STRAVA_API = 'https://www.strava.com/api/v3';

export interface StravaTotalsPeriod {
  distanceMiles: number;
  movingTimeSeconds: number;
  elevationGainM: number;
}

export interface StravaTotals {
  recent: StravaTotalsPeriod;
  ytd: StravaTotalsPeriod;
  allTime: StravaTotalsPeriod;
}

interface StravaActivityTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

function isActivityTotals(
  v: unknown,
): v is StravaActivityTotals {
  return (
    typeof v === 'object' &&
    v !== null &&
    'distance' in v &&
    typeof (v as StravaActivityTotals).distance === 'number'
  );
}

function sumTotals(
  ride: unknown,
  run: unknown,
): StravaTotalsPeriod {
  const r = isActivityTotals(ride)
    ? ride
    : { distance: 0, moving_time: 0, elevation_gain: 0 };
  const u = isActivityTotals(run)
    ? run
    : { distance: 0, moving_time: 0, elevation_gain: 0 };
  // Convert meters to miles (1 meter = 0.000621371 miles)
  const distanceMeters = r.distance + u.distance;
  const distanceMiles = distanceMeters * 0.000621371;

  return {
    distanceMiles,
    movingTimeSeconds: r.moving_time + u.moving_time,
    elevationGainM: r.elevation_gain + u.elevation_gain,
  };
}

async function getAccessTokenAndAthleteId(): Promise<{
  accessToken: string;
  athleteId: number;
}> {
  const {
    stravaClientId,
    stravaClientSecret,
    stravaRefreshToken,
  } = config;

  if (!stravaClientId || !stravaClientSecret || !stravaRefreshToken) {
    throw new Error(
      'Strava is not configured. Set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN in your .env.',
    );
  }

  const body = new URLSearchParams({
    client_id: stravaClientId,
    client_secret: stravaClientSecret,
    refresh_token: stravaRefreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(`${STRAVA_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Strava token request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    athlete?: { id: number };
  };

  let athleteId: number | undefined = data.athlete?.id;
  if (athleteId == null) {
    const athleteRes = await fetch(`${STRAVA_API}/athlete`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (!athleteRes.ok) {
      throw new Error(
        'Strava token response did not include athlete. Re-authorize at /api/strava/auth.',
      );
    }
    const athlete = (await athleteRes.json()) as { id?: number };
    athleteId = athlete?.id;
  }

  if (athleteId == null) {
    throw new Error(
      'Could not get Strava athlete ID. Re-authorize at /api/strava/auth.',
    );
  }

  return {
    accessToken: data.access_token,
    athleteId,
  };
}

interface StravaActivityStats {
  recent_ride_totals?: StravaActivityTotals;
  recent_run_totals?: StravaActivityTotals;
  ytd_ride_totals?: StravaActivityTotals;
  ytd_run_totals?: StravaActivityTotals;
  all_ride_totals?: StravaActivityTotals;
  all_run_totals?: StravaActivityTotals;
}

export async function fetchTotals(): Promise<StravaTotals> {
  const { accessToken, athleteId } = await getAccessTokenAndAthleteId();

  const response = await fetch(
    `${STRAVA_API}/athletes/${athleteId}/stats`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Strava token expired or invalid. Re-authorize to get a new refresh token.',
      );
    }
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Strava API request failed: ${response.status}`,
    );
  }

  const stats = (await response.json()) as StravaActivityStats;

  return {
    recent: sumTotals(
      stats.recent_ride_totals,
      stats.recent_run_totals,
    ),
    ytd: sumTotals(stats.ytd_ride_totals, stats.ytd_run_totals),
    allTime: sumTotals(stats.all_ride_totals, stats.all_run_totals),
  };
}

export function getAuthUrl(): string {
  const { stravaClientId, stravaRedirectUri } = config;
  if (!stravaClientId || !stravaRedirectUri) {
    throw new Error(
      'Strava is not configured. Set STRAVA_CLIENT_ID and STRAVA_REDIRECT_URI in your .env.',
    );
  }
  const params = new URLSearchParams({
    client_id: stravaClientId,
    response_type: 'code',
    redirect_uri: stravaRedirectUri,
    scope: 'activity:read_all',
    approval_prompt: 'force',
  });
  return `${STRAVA_OAUTH}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<{ refreshToken: string }> {
  const {
    stravaClientId,
    stravaClientSecret,
    stravaRedirectUri,
  } = config;
  if (!stravaClientId || !stravaClientSecret || !stravaRedirectUri) {
    throw new Error(
      'Strava is not configured. Set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REDIRECT_URI in your .env.',
    );
  }

  const body = new URLSearchParams({
    client_id: stravaClientId,
    client_secret: stravaClientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: stravaRedirectUri,
  });

  const response = await fetch(`${STRAVA_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text || `Strava token exchange failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as { refresh_token: string };
  return { refreshToken: data.refresh_token };
}
