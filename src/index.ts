export type KonsekiMcpConfig = {
  apiBaseUrl: string;
  apiKey: string;
};

export function loadConfigFromEnv(env: Record<string, string | undefined> = process.env): KonsekiMcpConfig {
  const apiBaseUrl = env.KONSEKI_API_BASE_URL?.trim() || "https://api.konseki.io";
  const apiKey = env.KONSEKI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("KONSEKI_API_KEY is required.");
  }

  return {
    apiBaseUrl,
    apiKey,
  };
}
