import { describe, it, expect } from "vitest";
import { resolveBaseUrl, loadExplainEnv, callTokenFactory } from "../../server/lib/tokenfactory";

describe("resolveBaseUrl (SSRF guard)", () => {
  it("defaults to the verified Nebius endpoint", () => {
    expect(resolveBaseUrl(undefined)).toBe("https://api.tokenfactory.nebius.com/v1");
  });

  it("accepts the documented AMD Radeon Cloud endpoint", () => {
    expect(resolveBaseUrl("https://developer.amd.com.cn/radeon/api/v1")).toBe(
      "https://developer.amd.com.cn/radeon/api/v1"
    );
  });

  it("accepts loopback http for local test mocks", () => {
    expect(resolveBaseUrl("http://127.0.0.1:59999/v1")).toBe("http://127.0.0.1:59999/v1");
    expect(resolveBaseUrl("http://localhost:59999/v1")).toBe("http://localhost:59999/v1");
  });

  it("strips trailing slashes", () => {
    expect(resolveBaseUrl("https://api.tokenfactory.nebius.com/v1/")).toBe(
      "https://api.tokenfactory.nebius.com/v1"
    );
  });

  it("rejects arbitrary external hosts (SSRF)", () => {
    expect(resolveBaseUrl("https://evil.example.com/v1")).toBeNull();
    expect(resolveBaseUrl("https://metadata.google.internal/computeMetadata/v1/")).toBeNull();
  });

  it("rejects non-HTTPS for external hosts", () => {
    expect(resolveBaseUrl("http://api.tokenfactory.nebius.com/v1")).toBeNull();
  });

  it("rejects internal network addresses by name or IP", () => {
    expect(resolveBaseUrl("https://169.254.169.254/latest/meta-data")).toBeNull();
    expect(resolveBaseUrl("https://10.0.0.1/internal")).toBeNull();
    expect(resolveBaseUrl("https://192.168.1.1/admin")).toBeNull();
  });

  it("rejects non-URL garbage and non-http(s) schemes", () => {
    expect(resolveBaseUrl("not a url")).toBeNull();
    expect(resolveBaseUrl("file:///etc/passwd")).toBeNull();
    expect(resolveBaseUrl("gopher://127.0.0.1/")).toBeNull();
  });
});

describe("loadExplainEnv + callTokenFactory with disallowed base URL", () => {
  it("marks the env unconfigured and refuses the outbound call", async () => {
    const saved = { ...process.env };
    try {
      process.env.TOKENFACTORY_BASE_URL = "https://evil.example.com/v1";
      process.env.TOKENFACTORY_API_KEY = "test-key";
      const env = loadExplainEnv();
      expect(env.baseUrl).toBe("");
      const result = await callTokenFactory(env, {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("provider_unavailable");
    } finally {
      process.env = saved;
    }
  });
});
