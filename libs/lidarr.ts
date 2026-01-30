/**
 * Server-only Lidarr API client.
 * Uses env: LIDARR_URL, LIDARR_API_KEY.
 * Optional: LIDARR_ROOT_FOLDER_PATH, LIDARR_QUALITY_PROFILE_ID for adding artists.
 */

function getConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.LIDARR_URL?.trim()?.replace(/\/$/, '');
  const apiKey = process.env.LIDARR_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

async function lidarrFetch<T>(
  path: string,
  options: RequestInit = {},
  optionsInternal?: { throwOnError: boolean }
): Promise<T | null> {
  const config = getConfig();
  if (!config) return null;
  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    let message = `Lidarr returned ${res.status}`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        message = parsed.message ?? parsed.error ?? message;
      } catch {
        message = text.slice(0, 200);
      }
    }
    if (optionsInternal?.throwOnError) {
      throw new Error(message);
    }
    return null;
  }
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export interface LidarrRootFolder {
  id: number;
  path: string;
}

export interface LidarrQualityProfile {
  id: number;
  name: string;
}

export async function getRootFolders(): Promise<LidarrRootFolder[]> {
  const data = await lidarrFetch<LidarrRootFolder[]>('/api/v1/rootfolder');
  return Array.isArray(data) ? data : [];
}

export async function getQualityProfiles(): Promise<LidarrQualityProfile[]> {
  const data = await lidarrFetch<LidarrQualityProfile[]>('/api/v1/qualityprofile');
  return Array.isArray(data) ? data : [];
}

export interface LidarrMetadataProfile {
  id: number;
  name: string;
}

export async function getMetadataProfiles(): Promise<LidarrMetadataProfile[]> {
  const data = await lidarrFetch<LidarrMetadataProfile[]>('/api/v1/metadataprofile');
  return Array.isArray(data) ? data : [];
}

export async function artistLookup(term: string): Promise<unknown[]> {
  const encoded = encodeURIComponent(term);
  const data = await lidarrFetch<unknown[]>(`/api/v1/artist/lookup?term=${encoded}`);
  return Array.isArray(data) ? data : [];
}

export async function albumLookup(term: string): Promise<unknown[]> {
  const encoded = encodeURIComponent(term);
  const data = await lidarrFetch<unknown[]>(`/api/v1/album/lookup?term=${encoded}`);
  return Array.isArray(data) ? data : [];
}

export function isLidarrConfigured(): boolean {
  return getConfig() !== null;
}

export function getDefaultRootFolder(): string | null {
  return process.env.LIDARR_ROOT_FOLDER_PATH?.trim() || null;
}

export function getDefaultQualityProfileId(): number | null {
  const v = process.env.LIDARR_QUALITY_PROFILE_ID?.trim();
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Add artist to Lidarr. Uses default root folder, quality profile, and metadata profile from env or first from API.
 */
export async function addArtist(body: Record<string, unknown>): Promise<unknown> {
  let rootFolderPath = getDefaultRootFolder();
  let qualityProfileId = getDefaultQualityProfileId();
  let metadataProfileId: number | null = null;
  const metadataProfileIdEnv = process.env.LIDARR_METADATA_PROFILE_ID?.trim();
  if (metadataProfileIdEnv) {
    const n = parseInt(metadataProfileIdEnv, 10);
    if (Number.isFinite(n)) metadataProfileId = n;
  }
  if (!rootFolderPath || qualityProfileId == null || metadataProfileId == null) {
    const [folders, profiles, metaProfiles] = await Promise.all([
      getRootFolders(),
      getQualityProfiles(),
      getMetadataProfiles(),
    ]);
    if (!rootFolderPath && folders.length > 0) rootFolderPath = folders[0].path;
    if (qualityProfileId == null && profiles.length > 0) qualityProfileId = profiles[0].id;
    if (metadataProfileId == null && metaProfiles.length > 0) metadataProfileId = metaProfiles[0].id;
  }
  if (!rootFolderPath || qualityProfileId == null) {
    throw new Error('Lidarr root folder or quality profile not configured');
  }
  const payload: Record<string, unknown> = {
    ...body,
    rootFolderPath,
    qualityProfileId,
    addOptions: { monitor: 'all', searchForMissingAlbums: false, ...(body.addOptions as object) },
    monitored: true,
  };
  if (metadataProfileId != null) {
    payload.metadataProfileId = metadataProfileId;
  }
  const result = await lidarrFetch<unknown>('/api/v1/artist', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { throwOnError: true });
  if (result == null) {
    throw new Error('Lidarr did not return a response');
  }
  return result;
}

/**
 * Add album to Lidarr.
 */
export async function addAlbum(body: Record<string, unknown>): Promise<unknown> {
  const result = await lidarrFetch<unknown>('/api/v1/album', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { throwOnError: true });
  if (result == null) {
    throw new Error('Lidarr did not return a response');
  }
  return result;
}
