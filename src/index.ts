export type KonsekiMcpConfig = {
  apiKey: string;
};

export const KONSEKI_API_ORIGIN = "https://api.konseki.io";

export function loadConfigFromEnv(env: Record<string, string | undefined> = process.env): KonsekiMcpConfig {
  const apiKey = env.KONSEKI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("KONSEKI_API_KEY is required.");
  }

  return {
    apiKey,
  };
}
