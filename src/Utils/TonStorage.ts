/* eslint max-classes-per-file: "off" */

import {IStorage} from '@tonconnect/sdk';

class TonStorage implements IStorage {
  public storage = new Map<string, string>();

  public getItem(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      resolve(this.storage.get(key) || null);
    });
  }

  public setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);

    return Promise.resolve();
  }

  public removeItem(key: string): Promise<void> {
    this.storage.delete(key);

    return Promise.resolve();
  }
}

export default new (class TonStorageHOC {
  public storages: Record<number, TonStorage> = {};

  public getStorage(userId: number): TonStorage {
    if (!this.storages[userId]) {
      this.storages[userId] = new TonStorage();
    }

    return this.storages[userId];
  }
})();
