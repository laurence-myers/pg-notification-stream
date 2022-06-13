# `pg-notification-stream`

An adapter for [the PostgreSQL client for NodeJS](https://node-postgres.com/), exposing notifications sent via the
`NOTIFY` command as a NodeJS stream (or `AsyncIterable`).

## License

MIT

## Installation

```shell
yarn add pg-notification-stream
```

## Usage

```typescript
import * as pg from "pg";
import { NotificationStream } from "pg-notification-stream";

async function iterateNotifications() {
  const client = new pg.Client({
    connectionString: "postgresql://user:password@host:5432/db",
  });
  await client.connect();

  const notificationChannel = "your_channel_name";
  const stream = new NotificationStream(client, notificationChannel);

  // Stop the iterator after 2 seconds, for demo purposes.
  setTimeout(() => stream.destroy(), 2000);

  // Using it as an async iterable
  for await (const notification of stream) {
    console.log(`A message? For me? Oh my! It says: ${notification}`);
  }

  await client.end();
}
```

## Notes

- You are responsible for creating/closing the database connection. An exclusive connection is recommended.
- A `LISTEN` command is executed once you start reading the stream.
- An `UNLISTEN` command is executed once the stream is destroyed.
