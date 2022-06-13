import type { Notification } from "./notification";

export interface Client {
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "notification", listener: (message: Notification) => void): this;
  on(event: "end", listener: () => void): this;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;

  query<R>(queryTextOrConfig: string): Promise<R>;

  removeListener(
    eventName: string | symbol,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (...args: any[]) => void
  ): this;
}
