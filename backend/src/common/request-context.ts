import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { loggerUtil } from 'src/shared/utils/log.util'

@Injectable()
export class RequestContext {
  private static storage = new AsyncLocalStorage<any>();

  static run(context: any, callback: () => void) {
    loggerUtil.info(
      `RequestContext run: ${JSON.stringify(context)}`,
    );
    this.storage.run(context, callback);
  }

  static get(key: string) {
    const store = this.storage.getStore();
    return store ? store[key] : null;
  }

  static set(key: string, value: any) {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }
}
