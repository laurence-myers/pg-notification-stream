import type { ClientBase } from "pg";
import { Readable, ReadableOptions } from "stream";
import { Notification } from "./notification";
import { noop } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

function addListeners(client: ClientBase, listeners: Map<string, Listener>) {
  for (const [eventName, listener] of listeners.entries()) {
    client.addListener(eventName, listener);
  }
}

function removeListeners(client: ClientBase, listeners: Map<string, Listener>) {
  for (const [eventName, listener] of listeners.entries()) {
    client.removeListener(eventName, listener);
  }
}

enum NotificationStreamStatus {
  Pending = "Pending",
  Active = "Active",
  Stopped = "Stopped",
  Errored = "Errored",
}

export class NotificationStream extends Readable {
  protected status = NotificationStreamStatus.Pending;

  constructor(
    protected readonly client: ClientBase,
    public readonly channel: string,
    readableOptions?: ReadableOptions
  ) {
    super({
      ...readableOptions,
      objectMode: true,
    });
  }

  override _construct?(callback: (error?: Error | null) => void): void {
    try {
      const client = this.client;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = new Map<string, (...args: any[]) => void>([
        [
          "notification",
          (message: Notification) => {
            if (message.channel === this.channel) {
              this.push(message.payload);
            }
          },
        ],
        [
          "end",
          () => {
            this.status = NotificationStreamStatus.Stopped;
            removeListeners(client, listeners);
            this.push(null);
          },
        ],
        [
          "error",
          (err: unknown) => {
            this.status = NotificationStreamStatus.Errored;
            removeListeners(client, listeners);
            this.destroy(err as Error); // lie, assume err is Error, to satisfy the interface
          },
        ],
      ]);

      addListeners(client, listeners);

      this.status = NotificationStreamStatus.Active;

      callback();
    } catch (err) {
      callback(err as Error); // lie
    }
  }

  public override _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    Promise.resolve(this.client)
      .then((client): void | Promise<void> => {
        if (this.status === NotificationStreamStatus.Active) {
          return client.query(`UNLISTEN "${this.channel}";`).then(noop);
        }
      })
      .then(() => super._destroy(error, callback), callback);
  }

  override _read(): void {
    if (!this.client) {
      this.destroy(new Error(`Client not initialised`));
      return;
    }
    this.client.query(`LISTEN "${this.channel}";`).catch((err) => {
      this.destroy(err);
    });
  }
}
