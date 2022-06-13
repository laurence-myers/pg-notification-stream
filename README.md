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

  // Using it as an async iterable
  for await (const notification of stream) {
    console.log(`A message? For me? Oh my! It says: ${notification}`);
  }

  await client.end();
}

async function demo2() {
  const iteratorPromise = iterateNotifications(); // don't wait for this promise, for demo purposes

  // Stop the iterator after 2 seconds
  setTimeout(() => stream.destroy(), 2000);

  // Wait for the iterator to resolve
  await iteratorPromise;
}
```

## Notes

- You are responsible for creating/closing the database connection. An exclusive connection is recommended.
- A `LISTEN` command is executed once you start reading the stream.
- An `UNLISTEN` command is executed once the stream is destroyed.
