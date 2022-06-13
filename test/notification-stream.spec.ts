import { Client } from "pg";
import { NotificationStream } from "../src/notification-stream";
import { sleep } from "./test-utilts";
import { Disposable, using } from "./using";

class DisposableClient extends Client implements Disposable {
  public async dispose(): Promise<void> {
    try {
      await this.end();
    } catch (err) {
      console.log(err);
    }
  }
}

describe(NotificationStream.name, () => {
  const channel = "test_channel";
  const testPayload = "Test Payload";

  async function clientFactory(applicationName: string) {
    const client = new DisposableClient({
      application_name: applicationName,
      connectionString:
        "postgresql://postgres:password@127.0.0.1:5432/postgres",
    });
    await client.connect();
    return client;
  }

  async function sendNotification() {
    await using(await clientFactory("test_notifier"), async (client) => {
      await client.query(`NOTIFY "${channel}", '${testPayload}';`);
    });
  }

  async function terminateConnection(applicationName = "test_listener") {
    await using(await clientFactory("test_terminator"), async (client) => {
      await client.query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE application_name = $1`,
        [applicationName]
      );
    });
  }

  describe(`async iterable API`, () => {
    async function iterateNotifications(
      notificationStream: NotificationStream
    ) {
      const notifications: string[] = [];
      for await (const notification of notificationStream) {
        notifications.push(notification);
      }
      return notifications;
    }

    it(`streams values as an async iterable`, async () => {
      await using(
        await clientFactory("test_listener"),
        async (notificationClient) => {
          const notificationStream = new NotificationStream(
            notificationClient,
            channel
          );

          // Start listening for messages
          const iterablePromise = iterateNotifications(
            notificationStream
          ).catch((err) => {
            expect(err).toBeUndefined();
          });

          // Send a message
          await sendNotification();

          // Stop the notification stream
          notificationStream.destroy();

          // Wait for the iterable to end
          const notifications = await iterablePromise;
          await notificationClient.end();

          expect(notifications).toEqual([testPayload]);
        }
      );
    });

    it(`throws an error when the database connection unexpectedly disconnects`, async () => {
      await using(
        await clientFactory("test_listener"),
        async (notificationClient) => {
          const caughtClientErrors: unknown[] = [];
          notificationClient.on("error", (err) => {
            caughtClientErrors.push(err);
          });

          const notificationStream = new NotificationStream(
            notificationClient,
            channel
          );

          // Start listening for messages
          let caughtIterableError: unknown;

          const iterablePromise = iterateNotifications(
            notificationStream
          ).catch((err: unknown) => {
            // Expecting a rejected promise doesn't work for some reason; the error is uncaught.
            // Work around it by catching the error and checking it later.
            caughtIterableError = err;
          });

          // Terminate the listener's DB connection
          await terminateConnection();

          // Sleep, so we can consistently get a "test timeout" error
          await sleep(10);

          // Wait for the iterable to end
          await iterablePromise;
          expect(caughtIterableError).toMatchSnapshot("iterable error");
          expect(caughtClientErrors).toMatchSnapshot("client errors");
        }
      );
    });
  });
});
