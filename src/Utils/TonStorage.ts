/* eslint max-classes-per-file: "off" */
/* eslint class-methods-use-this: "off" */

import {IStorage} from '@tonconnect/sdk';

class TonStorage implements IStorage {
  public getItem(key: string): Promise<string | null> {
    // this method is not used

    return Promise.resolve(null);
  }

  public setItem(key: string, value: string): Promise<void> {
    // this method is not used

    return Promise.resolve();
  }

  public removeItem(key: string): Promise<void> {
    // this method is not used

    return Promise.resolve();
  }
}

// This is not used anymore but I'm keeping it here for future reference
export default new (class TonStorageHOC {
  public storages: Record<number, TonStorage> = {};

  public getStorage(userId: number): TonStorage {
    if (!this.storages[userId]) {
      this.storages[userId] = new TonStorage();
    }

    return this.storages[userId];
  }
})();
