import { describe, expect, it } from "vitest";
import { KONSEKI_API_ORIGIN, loadConfigFromEnv } from "../src/index.js";

describe("loadConfigFromEnv", () => {
  it("requires KONSEKI_API_KEY", () => {
    expect(() => loadConfigFromEnv({})).toThrow("KONSEKI_API_KEY is required.");
  });

  it("loads the API key without exposing API origin configuration", () => {
    const ignoredOriginEnvName = ["KONSEKI", "API", "BASE", "URL"].join("_");

    expect(
      loadConfigFromEnv({
        [ignoredOriginEnvName]: "https://example.invalid",
        KONSEKI_API_KEY: "ks_live_example",
      }),
    ).toEqual({
      apiKey: "ks_live_example",
    });
  });
});

describe("KONSEKI_API_ORIGIN", () => {
  it("uses the fixed official API origin", () => {
    expect(KONSEKI_API_ORIGIN).toBe("https://api.konseki.io");
  });
});
