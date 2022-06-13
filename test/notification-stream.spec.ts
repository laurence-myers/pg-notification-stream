import { Client } from "pg";
import { NotificationStream } from "../src/notification-stream";
import { Disposable, using } from "./using";

class DisposableClient extends Client implements Disposable {
  public dispose(): Promise<void> {
    return this.end();
  }
}

describe(NotificationStream.name, () => {
  const channel = "test_channel";
  const testPayload = "Test Payload";

  async function clientFactory() {
    const client = new DisposableClient({
      connectionString:
        "postgresql://postgres:password@127.0.0.1:5432/postgres",
    });
    await client.connect();
    return client;
  }

  async function sendNotification() {
    await using(await clientFactory(), async (client) => {
      await client.query(`NOTIFY "${channel}", '${testPayload}';`);
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
      await using(await clientFactory(), async (notificationClient) => {
        const notificationStream = new NotificationStream(
          notificationClient,
          channel
        );

        // Start listening for messages
        const iterablePromise = iterateNotifications(notificationStream).catch(
          (err) => {
            expect(err).toBeUndefined();
          }
        );

        // Send a message
        await sendNotification();

        // Stop the notification stream
        notificationStream.destroy();

        // Wait for the iterable to end
        const notifications = await iterablePromise;
        await notificationClient.end();

        expect(notifications).toEqual([testPayload]);
      });
    });
  });
});
