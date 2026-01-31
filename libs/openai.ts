/**
 * Server-only OpenAI client for AI playlists, natural-language search, and recommendation labels.
 * Uses env: OPENAI_API_KEY. Do not import in client components.
 * Uses dynamic import('openai') so the package is never bundled into client or RSC payload.
 * Note: Avoid adding 'server-only' here as it can cause webpack factory errors in dev.
 */
const DEFAULT_MAX_TOKENS = 1024;

function getApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isOpenAIConfigured(): boolean {
  return getApiKey() !== null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedClient: any = null;

/**
 * Returns a configured OpenAI client, or null if OPENAI_API_KEY is not set.
 * Use only in server code (API routes, Server Actions).
 * Uses dynamic import to avoid bundling the openai package into client bundles.
 */
export async function getOpenAIClient(): Promise<import('openai').OpenAI | null> {
  const key = getApiKey();
  if (!key) return null;
  if (cachedClient) return cachedClient;
  const { default: OpenAI } = await import('openai');
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
}

/**
 * Default max_tokens for chat completions (cost/abuse control).
 */
export function getDefaultMaxTokens(): number {
  return DEFAULT_MAX_TOKENS;
}
