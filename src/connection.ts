import { Client } from "pg";
import { dummyLogger, Logger } from "./logger";
import type { ClientConfig } from "./pg";
import type { Disposable } from "./using";

interface PgListenIterableConnectionOptions {
  logger?: Logger;
}

export class PgListenIterableConnection implements Disposable {
  protected _client?: Client;
  protected readonly logger: Logger;

  constructor(options?: PgListenIterableConnectionOptions) {
    this.logger = options?.logger ?? dummyLogger;
  }

  public get client(): Client | undefined {
    return this._client;
  }

  async connect(config: string | ClientConfig): Promise<void> {
    if (this._client) {
      return;
    }
    const client = new Client(config);

    client.on("error", (err) => {
      this.logger.error(err);
    });

    try {
      await client.connect();
      this._client = client;
    } catch (err) {
      this.logger.error(err);
    }
  }

  public async dispose(): Promise<void> {
    if (this._client) {
      this._client.removeAllListeners();
      await this._client.end();
      this._client = undefined;
    }
  }
}

export async function connect(
  config: string | ClientConfig,
  options?: PgListenIterableConnectionOptions
): Promise<void> {
  const logger = options?.logger ?? dummyLogger;
  const client = new Client(config);

  client.on("error", (err) => {
    logger.error(err);
  });

  await client.connect();
}
