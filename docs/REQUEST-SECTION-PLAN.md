# Request Section Enhancement Plan

## Current state

- **Request page** ([app/(site)/request/](app/(site)/request/)): Single search input, debounced; calls Lidarr artist lookup + album lookup only.
- **Display**: Artist name + Request button; Album "artist – title" + Request button. No images, no metadata, no "already in library" indication, no disambiguation.
- **Data flow**: Client fetches `/api/lidarr/artist/lookup?term=…` and `/api/lidarr/album/lookup?term=…`, then POSTs to `/api/lidarr/request` for artist or album. All displayed data comes from raw Lidarr lookup responses typed as `unknown[]`.

---

## Datasources (stack)

| Source | Purpose | What we have |
|--------|---------|---------------|
| **Lidarr** | Request target (add artist/album, trigger download) | `artistLookup(term)`, `albumLookup(term)`, `addArtist`, `addAlbum`. Returns arrays of artist/album objects (foreignArtistId, artistName, overview, links, images, disambiguation; album: title, releaseDate, artist, foreignAlbumId, etc.). |
| **MusicBrainz** | Metadata, disambiguation, release info | `searchArtists`, `searchReleases`, `searchRecordings`; `getArtist(mbid)` (url-relations); `getRelease(mbid)` (artist-credits, release-groups, url-relations). No API key; ~1 req/s. |
| **Spotify** | Artwork, genres, links, release date | `search(q, type, limit)`, `getArtist(id)`, `getAlbum(id)`, `enrichAlbumByQuery(albumName, artistName)`. Requires Client Credentials. |
| **Navidrome** | "Already in library" check | `search2(query)` → artists, albums, songs. Can check if an artist or album name exists in the user’s library before/after showing Lidarr results. |

Lidarr uses MusicBrainz IDs (`foreignArtistId`, `foreignAlbumId`) internally, so we can use those for MusicBrainz enrichment when present.

---

## Goals

1. **User fully informed when searching**: Show artwork, disambiguation (e.g. "Artist (2)"), release date, genres, overview/summary where available.
2. **User fully informed when requesting**: Clear what will be added (artist vs album), and whether it’s already in the library.
3. **Single, coherent search experience**: One server-side "request search" that aggregates Lidarr + optional enrichment so the UI stays simple and fast.

---

## Plan (high level)

1. **Type Lidarr responses** – Add minimal types for Lidarr artist/album lookup in [libs/lidarr.ts](libs/lidarr.ts) (or [types.ts](types.ts)) and use them in the API routes so we know which fields exist (e.g. overview, links, images, disambiguation, releaseDate).
2. **New aggregated search API** – Add a single endpoint (e.g. `GET /api/request/search?q=…`) that:
   - Runs Lidarr artist lookup + album lookup (as today).
   - Optionally enriches with **Spotify** (if configured): per artist/album, match by name and attach image URL, Spotify link, genres (artist), release_date (album) using existing `search` / `enrichAlbumByQuery` or similar.
   - Optionally enriches with **MusicBrainz**: use Lidarr’s `foreignArtistId` / `foreignAlbumId` (when present) to call `getArtist` / `getRelease` for disambiguation, release date, and relations; respect rate limit (~1 req/s), e.g. limit to first N results.
   - Optionally checks **Navidrome** (if configured): for each artist name and each (artist, album) pair, call Navidrome search and mark which artists/albums already exist in library; return "alreadyInLibrary" flags.
   - Returns one JSON payload: `{ artists: EnrichedArtist[], albums: EnrichedAlbum[] }` with all fields the UI needs.
3. **Request UI overhaul** – Update [RequestContent.tsx](app/(site)/request/components/RequestContent.tsx):
   - **Artist row**: Thumbnail (Spotify or Lidarr image), name, disambiguation in parentheses if present, "Already in library" badge (from Navidrome), genres (Spotify), optional short overview (expand/collapse). Request button; if already in library, show "Already in library" and optionally disable or soften request.
   - **Album row**: Artwork, title, artist, release date, "Already in library" badge, optional track count or link. Request button; same "Already in library" behavior.
   - **Loading / empty**: Skeleton or spinner while searching; clear "No results" with suggestion to try different terms; if Lidarr is down, show a short message.
4. **Request feedback** – After successful request: toast or inline message like "Added to Lidarr; it will download and appear in your library." If the user requested something that’s already in library (we know from Navidrome), show "Already available in your library" instead of sending to Lidarr (or still allow request and show both messages).
5. **Already-in-library (Navidrome)** – In the aggregated search, after Lidarr returns:
   - For each artist: call Navidrome search with artist name (or normalized name); if any result matches, set `alreadyInLibrary: true` for that artist.
   - For each album: call Navidrome search with album title and/or artist; if a matching album is found, set `alreadyInLibrary: true` for that album.
   - Return these flags so the UI can show badges and adjust CTAs. Keep Navidrome calls bounded (e.g. limit to top 10 artists + top 10 albums) to avoid rate/load issues.
6. **Optional: MusicBrainz disambiguation only** – If we don’t want full MusicBrainz fetch for every result, we can use MusicBrainz search only (one call per query) and merge "disambiguation" text into Lidarr results by matching on name/MBID; that keeps rate limit impact low while still showing disambiguation.

---

## Implementation order

1. **Types** – Add `LidarrArtistLookup` and `LidarrAlbumLookup` (and optionally `EnrichedArtist` / `EnrichedAlbum`) so the rest of the work is type-safe.
2. **Aggregated search API** – Implement `GET /api/request/search?q=…` (or similar) that returns Lidarr results + optional Spotify + optional MusicBrainz + optional Navidrome "already in library". Start with Lidarr + Navidrome only if you want to ship "already in library" first; add Spotify/MusicBrainz in follow-up.
3. **RequestContent** – Switch to calling the new search endpoint; render artist/album cards with thumbnail, name, disambiguation, release date, genres, "Already in library", and overview (expandable). Adjust request button and post-request messaging as above.
4. **Polish** – Loading skeletons, empty state copy, error state if Lidarr or search fails.

---

## Files to touch

| Area | Files |
|------|--------|
| Types | [types.ts](types.ts) or [libs/lidarr.ts](libs/lidarr.ts) – Lidarr lookup + enriched types |
| API | New [app/api/request/search/route.ts](app/api/request/search/route.ts) (or under lidarr) – aggregated search |
| API | Optional: [app/api/lidarr/artist/lookup](app/api/lidarr/artist/lookup/route.ts) / [album/lookup](app/api/lidarr/album/lookup/route.ts) – return typed responses |
| Request UI | [app/(site)/request/components/RequestContent.tsx](app/(site)/request/components/RequestContent.tsx) – new layout, enrichment display, "Already in library" |
| Request page | [app/(site)/request/page.tsx](app/(site)/request/page.tsx) – optional: pass Navidrome/Spotify configured flags if needed for conditional UI |

---

## Lidarr API reference (for typing)

Lidarr’s artist lookup and album lookup follow the same pattern as other *arr apps. Typical artist object includes: `id`, `foreignArtistId` (MusicBrainz), `artistName`, `overview`, `links[]`, `images[]`, `disambiguation`. Album object: `foreignAlbumId`, `title`, `releaseDate`, `artist` (or `artistName`), `images[]`, `links[]`. When in doubt, log one response from `artistLookup` / `albumLookup` and type the fields you actually use.

---

## Summary

Make the Request section comprehensive by: (1) typing Lidarr responses, (2) adding one aggregated search API that combines Lidarr + optional Spotify/MusicBrainz enrichment + Navidrome "already in library", and (3) updating the Request UI to show thumbnails, disambiguation, release date, genres, overview, and "Already in library" so the user is fully informed when searching and requesting. Use the existing stack (Lidarr, MusicBrainz, Spotify, Navidrome) without adding new dependencies.
