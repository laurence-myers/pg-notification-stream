import type { ClientBase } from "pg";
import { Readable, ReadableOptions } from "stream";
import { Notification } from "./notification";

export class NotificationStream extends Readable {
  constructor(
    protected readonly client: ClientBase,
    public readonly channel: string,
    readableOptions?: Omit<ReadableOptions, "objectMode">
  ) {
    super({
      ...readableOptions,
      objectMode: true,
    });
  }

  override _construct?(callback: (error?: Error | null) => void): void {
    try {
      this.addListeners();

      callback();
    } catch (err) {
      callback(err as Error); // lie
    }
  }

  override _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    this.removeListeners();
    this.client.query(`UNLISTEN "${this.channel}";`).then(
      () => callback(error),
      () => callback(error) // Connection could be closed. Don't allow this query to mask the original error
    );
  }

  override _read(): void {
    this.client.query(`LISTEN "${this.channel}";`).catch((err) => {
      this.destroy(err);
    });
  }

  protected addListeners(): void {
    this.client.once("end", this.onEnd);
    this.client.once("error", this.onError);
    this.client.on("notification", this.onNotification);
  }

  protected onEnd = (): void => {
    this.push(null);
    this.destroy();
  };

  protected onError = (err: unknown): void => {
    this.destroy(err as Error); // lie, assume err is Error, to satisfy the interface
  };

  protected onNotification = (message: Notification): void => {
    if (message.channel === this.channel) {
      this.push(message.payload);
    }
  };

  protected removeListeners(): void {
    this.client.removeListener("notification", this.onNotification);
  }
}
