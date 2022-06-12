import { noop } from "./utils";

export interface Logger {
  error(message: unknown): void;
}

export const dummyLogger: Logger = {
  error: noop,
};
