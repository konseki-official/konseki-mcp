import { describe, expect, it } from "vitest";

describe("package entrypoint", () => {
  it("can be imported without starting the stdio server", async () => {
    const module = await import("../src/index.js");

    expect(module.KONSEKI_API_ORIGIN).toBe("https://api.konseki.io");
    expect(module.loadConfigFromEnv).toBeTypeOf("function");
  });
});
