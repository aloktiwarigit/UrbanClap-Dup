import { getDeviceTokensContainer } from './client.js';
import type { DeviceTokenDoc } from '../schemas/device-token.js';

type UserType = DeviceTokenDoc['userType'];

export class DeviceTokenRepository {
  private get container() { return getDeviceTokensContainer(); }

  /**
   * Upserts a device token for the given user.
   * id = `${userId}:${deviceToken}` so each physical device gets one doc per user.
   * lastSeen is refreshed on every call — used by pruneStaleTokens.
   */
  async registerDeviceToken(
    userId:      string,
    userType:    UserType,
    deviceToken: string,
    platform:    string,
    appBuild?:   string,
  ): Promise<void> {
    const doc: DeviceTokenDoc = {
      id: `${userId}:${deviceToken}`,
      userId,
      userType,
      deviceToken,
      platform:  platform as DeviceTokenDoc['platform'],
      lastSeen:  new Date().toISOString(),
      ...(appBuild !== undefined ? { appBuild } : {}),
    };
    await this.container.items.upsert(doc);
  }

  /**
   * Returns the raw FCM token strings for a user.
   * SELECT projects only deviceToken — no PII (userId / appBuild) leaves this call.
   */
  async getDeviceTokensForUser(userId: string): Promise<string[]> {
    const { resources } = await this.container.items
      .query<{ deviceToken: string }>({
        query: 'SELECT c.deviceToken FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();
    return resources.map((r) => r.deviceToken);
  }

  /**
   * Removes a specific device token (e.g. on FCM unregistered callback).
   * Silently ignores 404 — token may already have been pruned.
   */
  async unregisterDeviceToken(userId: string, deviceToken: string): Promise<void> {
    try {
      await this.container.item(`${userId}:${deviceToken}`, userId).delete();
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 404) return;
      throw err;
    }
  }

  /**
   * Deletes all device tokens for a user — call on sign-out / account deletion.
   * Queries then deletes individually (Cosmos Serverless has no bulk delete).
   */
  async unregisterAllForUser(userId: string): Promise<void> {
    const { resources } = await this.container.items
      .query<{ id: string; userId: string }>({
        query: 'SELECT c.id, c.userId FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    await Promise.all(
      resources.map((doc) => this.container.item(doc.id, doc.userId).delete()),
    );
  }

  /**
   * Returns all device tokens registered by admin users (userType = 'admin').
   * Cross-partition query — used for sending to all enrolled admin browsers.
   */
  async getAllAdminDeviceTokens(): Promise<string[]> {
    const { resources } = await this.container.items
      .query<{ deviceToken: string }>({
        query: "SELECT c.deviceToken FROM c WHERE c.userType = 'admin'",
      })
      .fetchAll();
    return resources.map((r) => r.deviceToken);
  }

  /**
   * Deletes tokens whose lastSeen is older than `olderThanDays` days.
   * Called by a daily timer trigger (E19-S02 WS-C).
   * Returns the number of tokens deleted.
   */
  async pruneStaleTokens(olderThanDays: number): Promise<number> {
    const cutoff = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { resources } = await this.container.items
      .query<{ id: string; userId: string }>({
        query: 'SELECT c.id, c.userId FROM c WHERE c.lastSeen < @cutoff',
        parameters: [{ name: '@cutoff', value: cutoff }],
      })
      .fetchAll();

    await Promise.all(
      resources.map((doc) => this.container.item(doc.id, doc.userId).delete()),
    );

    return resources.length;
  }
}

export const deviceTokenRepo = new DeviceTokenRepository();
