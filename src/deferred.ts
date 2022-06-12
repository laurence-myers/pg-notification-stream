import { noop } from "./utils";

interface Deferred<T> {
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
}

export function deferred<T>(): Deferred<T> {
  let reject: (error: unknown) => void = noop;
  let resolve: (value: T) => void = noop;
  const promise = new Promise<T>((resolve1, reject1) => {
    resolve = resolve1;
    reject = reject1;
  });
  return {
    promise,
    reject,
    resolve,
  };
}
