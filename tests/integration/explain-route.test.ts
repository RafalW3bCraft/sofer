import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startMockTokenFactory, type MockHandle } from "./mock-tokenfactory";
import { callTokenFactory } from "../../server/lib/tokenfactory";

describe("callTokenFactory", () => {
  let mock: MockHandle | null = null;
  const originalFetch = globalThis.fetch;

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    if (mock) await mock.close();
    mock = null;
    delete process.env.TOKENFACTORY_BASE_URL;
    delete process.env.TOKENFACTORY_MODEL;
  });

  it("returns provider_unavailable when no API key is set", async () => {
    const r = await callTokenFactory(
      {
        apiKey: null,
        baseUrl: "http://127.0.0.1:1/v1",
        model: "mock",
        timeoutMs: 1000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("provider_unavailable");
  });

  it("returns ok with a parsed explanation on 200", async () => {
    mock = await startMockTokenFactory();
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock-model",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.response.explanation).toContain("Mock explanation");
      expect(r.response.model).toBe("mock-model");
    }
  });

  it("returns provider_unavailable on 401", async () => {
    mock = await startMockTokenFactory({ status: 401 });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("provider_unavailable");
  });

  it("returns rate_limited on 429", async () => {
    mock = await startMockTokenFactory({ status: 429 });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate_limited");
  });

  it("returns provider_unavailable on 5xx", async () => {
    mock = await startMockTokenFactory({ status: 503 });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("provider_unavailable");
  });

  it("returns timeout when the provider is too slow", async () => {
    mock = await startMockTokenFactory({ delayMs: 200 });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock",
        timeoutMs: 50,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("timeout");
  });

  it("returns schema_mismatch when the body has no choices", async () => {
    mock = await startMockTokenFactory({ body: { oops: true } });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("schema_mismatch");
  });

  it("truncates an over-long assistant response to 800 chars", async () => {
    const huge = "X".repeat(2000);
    mock = await startMockTokenFactory({
      body: {
        choices: [{ message: { role: "assistant", content: huge } }],
      },
    });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "mock",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.response.explanation.length).toBeLessThanOrEqual(800);
    }
  });

  it("returns model_not_available on 404", async () => {
    mock = await startMockTokenFactory({ status: 404 });
    const r = await callTokenFactory(
      {
        apiKey: "test-key",
        baseUrl: mock.baseUrl,
        model: "missing-model",
        timeoutMs: 2000,
      },
      {
        context: "word",
        arabic: "ٱلسَّلَامُ",
        lessonId: "greetings-1",
        requestId: crypto.randomUUID(),
      }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("model_not_available");
  });
});