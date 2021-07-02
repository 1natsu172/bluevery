import _set from 'lodash.set';
import {
  InternalListeners,
  PeripheralId,
  PublicListeners,
  PublicSubscriptions,
} from './interface';
import {debugBlueveryListener} from './utils';

export class BlueveryListeners {
  readonly publicListeners: PublicListeners = {};
  readonly internalListeners: InternalListeners = {};

  /**
   * @description setProperty util method
   */
  setAnyPublicSubscription<Key extends keyof PublicSubscriptions>(
    peripheralId: PeripheralId,
    key: Key,
    value: PublicSubscriptions[Key],
  ) {
    debugBlueveryListener(
      'set to publicListeners that',
      peripheralId,
      key,
      value,
    );
    _set(this.publicListeners, `${peripheralId}.${key}`, value);
  }
  setAnyInternalSubscription<Key extends keyof InternalListeners>(
    key: Key,
    value: InternalListeners[Key],
  ) {
    debugBlueveryListener('set to internalListeners that', key, value);
    _set(this.internalListeners, `${key}`, value);
  }

  removeAnyPublicSubscription<Key extends keyof PublicSubscriptions>(
    peripheralId: PeripheralId,
    key: Key,
  ) {
    debugBlueveryListener('remove from publicListeners', peripheralId, key);
    const subscription = this.publicListeners[peripheralId]?.[key];
    if (subscription) {
      debugBlueveryListener(
        'match the remove target subscription',
        peripheralId,
        key,
      );
      subscription.remove();
      delete this.publicListeners[peripheralId]?.[key];
    }
  }

  removeAnyInternalSubscription<Key extends keyof InternalListeners>(key: Key) {
    debugBlueveryListener('remove from internalListeners', key);
    const subscription = this.internalListeners[key];
    if (subscription) {
      debugBlueveryListener('match the remove target subscription', key);
      subscription.remove();
      delete this.internalListeners[key];
    }
  }

  removePeripheralPublicSubscription(peripheralId: PeripheralId) {
    debugBlueveryListener(
      'remove public subscription of peripheral',
      peripheralId,
    );
    const subscription = this.publicListeners[peripheralId];
    if (subscription) {
      debugBlueveryListener(
        'match the remove target subscriptions',
        peripheralId,
      );
      Object.values(subscription).forEach((listener) => {
        listener?.remove();
      });
    }
    delete this.publicListeners[peripheralId];
  }

  private removeAllInternalSubscriptions() {
    (Object.keys(this.internalListeners) as Array<
      keyof InternalListeners
    >).forEach((key) => {
      this.removeAnyInternalSubscription(key);
    });
  }

  private removeAllPublicSubscriptions() {
    Object.keys(this.publicListeners).forEach((peripheralKeys) => {
      this.removePeripheralPublicSubscription(peripheralKeys);
    });
  }

  removeAllSubscriptions() {
    debugBlueveryListener('remove all subscriptions');
    this.removeAllInternalSubscriptions();
    this.removeAllPublicSubscriptions();
  }
}
