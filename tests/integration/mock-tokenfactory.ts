import express from "express";
import type { AddressInfo } from "node:net";

interface RecordedRequest {
  path: string;
  method: string;
  body: string;
  authorization?: string;
}

export interface MockTokenFactoryOptions {
  status?: number;
  body?: unknown;
  delayMs?: number;
  forceNetworkError?: boolean;
  recorded?: RecordedRequest[];
}

export interface MockHandle {
  port: number;
  baseUrl: string;
  recorded: RecordedRequest[];
  close: () => Promise<void>;
}

/** Start an in-process mock Token Factory server on a random port. */
export async function startMockTokenFactory(
  options: MockTokenFactoryOptions = {}
): Promise<MockHandle> {
  const app = express();
  app.use(express.json({ limit: "256kb" }));

  const recorded: RecordedRequest[] = options.recorded ?? [];

  const v1 = express.Router();
  v1.get("/models", (_req, res) => {
    res.json({ data: [{ id: "mock-model" }] });
  });

  v1.post("/chat/completions", async (req, res) => {
    let raw = "";
    try {
      raw = JSON.stringify(req.body);
    } catch {
      raw = "<unserializable>";
    }
    recorded.push({
      path: req.path,
      method: req.method,
      body: raw,
      authorization: req.header("authorization"),
    });
    if (options.delayMs) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }
    if (options.forceNetworkError) {
      req.socket.destroy();
      return;
    }
    const status = options.status ?? 200;
    res.status(status).json(
      options.body ?? {
        id: "mock",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Mock explanation. (not a real model response)",
            },
          },
        ],
      }
    );
  });
  app.use("/v1", v1);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const port = (server.address() as AddressInfo).port;
  return {
    port,
    baseUrl: `http://127.0.0.1:${port}/v1`,
    recorded,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}