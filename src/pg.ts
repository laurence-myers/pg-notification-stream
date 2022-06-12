import type { CustomTypesConfig } from "pg";
import type { Duplex } from "stream";
import type { ConnectionOptions } from "tls";

/**
 * Type definitions for pg 8.6
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/cdceb7dbee6cfd9c9093ad0406792ff0f90472f7/types/pg/index.d.ts
 */
export interface ClientConfig {
  user?: string | undefined;
  database?: string | undefined;
  password?: string | (() => string | Promise<string>) | undefined;
  port?: number | undefined;
  host?: string | undefined;
  connectionString?: string | undefined;
  keepAlive?: boolean | undefined;
  stream?: Duplex | undefined;
  statement_timeout?: false | number | undefined;
  parseInputDatesAsUTC?: boolean | undefined;
  ssl?: boolean | ConnectionOptions | undefined;
  query_timeout?: number | undefined;
  keepAliveInitialDelayMillis?: number | undefined;
  idle_in_transaction_session_timeout?: number | undefined;
  application_name?: string | undefined;
  connectionTimeoutMillis?: number | undefined;
  types?: CustomTypesConfig | undefined;
  options?: string | undefined;
}
