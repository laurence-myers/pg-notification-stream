import { Client } from "pg";
import { NotificationStream } from "../src/notification-stream";

describe(NotificationStream.name, () => {
  it(`streams values as an async iterable`, async () => {
    const clientFactory = async () => {
      const client = new Client({
        connectionString:
          "postgresql://postgres:password@127.0.0.1:5432/postgres",
      });

      await client.connect();

      return client;
    };
    const notificationClient = await clientFactory();

    try {
      const channel = "test_channel";

      const notificationStream = new NotificationStream(
        notificationClient,
        channel
      );

      // Start listening for messages
      const iterablePromise = (async () => {
        const notifications: string[] = [];
        for await (const notification of notificationStream) {
          notifications.push(notification);
        }
        return notifications;
      })().catch((err) => {
        expect(err).toBeUndefined();
      });

      // Send a message
      const client = await clientFactory();
      const testPayload = "Test Payload";
      await client.query(`NOTIFY "${channel}", '${testPayload}';`);
      await client.end();

      // Stop the notification stream
      notificationStream.destroy();

      // Wait for the iterable to end
      const notifications = await iterablePromise;
      await notificationClient.end();

      expect(notifications).toEqual([testPayload]);
    } finally {
      await notificationClient.end();
    }
  });
});