import { Client } from "pg";
import { deferred } from "./deferred";
import { Notification } from "./notification";

export async function toAsyncIterable(
  client: Client,
  channel: string
): Promise<AsyncIterable<Notification>> {
  let nextDeferred = deferred<IteratorResult<Notification>>();

  function removeListeners() {
    for (const [eventName, listener] of listeners.entries()) {
      client.removeListener(eventName, listener);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners = new Map<string, (...args: any[]) => void>([
    [
      "notification",
      (message: Notification) => {
        nextDeferred.resolve({
          done: false,
          value: message,
        });
      },
    ],
    [
      "end",
      () => {
        removeListeners();
        nextDeferred.resolve({
          done: true,
          value: undefined,
        });
      },
    ],
    [
      "error",
      (err: unknown) => {
        removeListeners();
        nextDeferred.reject(err);
      },
    ],
  ]);

  for (const [eventName, listener] of listeners.entries()) {
    client.addListener(eventName, listener);
  }

  try {
    await client.query(`LISTEN $1;`, [channel]);
  } catch (err) {
    removeListeners();
    nextDeferred.reject(err);
    return nextDeferred.promise as Promise<unknown> as Promise<
      AsyncIterable<Notification>
    >;
  }

  return {
    [Symbol.asyncIterator]: () => ({
      async next(): Promise<IteratorResult<Notification>> {
        const value = await nextDeferred.promise;
        nextDeferred = deferred();
        return value;
      },
    }),
  };
}
