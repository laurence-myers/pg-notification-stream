import type { Logger } from "./logger";

export interface Disposable {
  dispose(): Promise<void>;
}

export async function using<TResource extends Disposable, TReturn>(
  resource: TResource,
  callback: (resource: TResource) => Promise<TReturn>,
  options?: { logger: Logger }
): Promise<TReturn> {
  try {
    return await callback(resource);
  } finally {
    try {
      await resource.dispose();
    } catch (err) {
      if (options?.logger) {
        options.logger.error(err);
      }
    }
  }
}
