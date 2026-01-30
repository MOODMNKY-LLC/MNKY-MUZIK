import Stripe from 'stripe';

/** Prefix for Navidrome track ids in player/store (distinguish from Supabase song id). */
export const NAVIDROME_ID_PREFIX = 'nd:';

export interface Song {
  id: string;
  user_id: string;
  author: string;
  title: string;
  song_path: string;
  image_path: string;
}

/** Navidrome (Subsonic) track – from getSong / Child. */
export interface NavidromeTrack {
  id: string;
  source: 'navidrome';
  title: string;
  artist?: string;
  album?: string;
  coverArt?: string;
  duration?: number;
  /** For display; Subsonic often uses 'song' for type. */
  contentType?: string;
}

/** Supabase song used as a playable track (source supabase). */
export type SupabaseTrack = Song & { source: 'supabase' };

/** Union: playable track from either Supabase or Navidrome. */
export type Track = SupabaseTrack | NavidromeTrack;

export function isNavidromeTrack(t: Track): t is NavidromeTrack {
  return t.source === 'navidrome';
}

export function isSupabaseTrack(t: Track): t is SupabaseTrack {
  return t.source === 'supabase';
}

export type UserRole = 'admin' | 'beta' | 'user';

export interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string;
  billing_address?: Stripe.Address;
  payment_method?: Stripe.PaymentMethod[Stripe.PaymentMethod.Type];
  role?: UserRole;
  beta_until?: string | null;
}

export interface Product {
  id: string;
  active?: boolean;
  name?: string;
  description?: string;
  image?: string;
  metadata?: Stripe.Metadata;
}

export interface Price {
  id: string;
  product_id?: string;
  active?: boolean;
  description?: string;
  unit_amount?: number;
  currency?: string;
  type?: Stripe.Price.Type;
  interval?: Stripe.Price.Recurring.Interval;
  interval_count?: number;
  trial_period_days?: number | null;
  metadata?: Stripe.Metadata;
  products?: Product;
}

export interface ProductWithPrice extends Product {
  prices?: Price[];
}

export interface Subscription {
  id: string;
  user_id: string;
  status?: Stripe.Subscription.Status;
  metadata?: Stripe.Metadata;
  price_id?: string;
  quantity?: number;
  cancel_at_period_end?: boolean;
  created: string;
  current_period_start: string;
  current_period_end: string;
  ended_at?: string;
  cancel_at?: string;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  prices?: Price;
}

/** Lidarr artist lookup response (API v1 artist/lookup). */
export interface LidarrArtistLookup {
  id?: number;
  foreignArtistId?: string;
  artistName?: string;
  name?: string;
  overview?: string;
  disambiguation?: string;
  links?: { url?: string; name?: string }[];
  images?: { url?: string; coverType?: string }[];
  [key: string]: unknown;
}

/** Lidarr album lookup response (API v1 album/lookup). */
export interface LidarrAlbumLookup {
  id?: number;
  foreignAlbumId?: string;
  title?: string;
  releaseDate?: string;
  artist?: { artistName?: string; name?: string; foreignArtistId?: string };
  artistName?: string;
  overview?: string;
  links?: { url?: string; name?: string }[];
  images?: { url?: string; coverType?: string }[];
  [key: string]: unknown;
}

/** Enriched artist for Request UI (Lidarr + Spotify/Navidrome). */
export interface EnrichedRequestArtist extends LidarrArtistLookup {
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  genres?: string[];
  alreadyInLibrary?: boolean;
}

/** Enriched album for Request UI (Lidarr + Spotify/Navidrome). */
export interface EnrichedRequestAlbum extends LidarrAlbumLookup {
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  alreadyInLibrary?: boolean;
}
