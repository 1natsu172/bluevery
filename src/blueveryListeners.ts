import _set from 'lodash.set';
import {
  InternalListeners,
  PeripheralId,
  PublicListeners,
  PublicSubscriptions,
} from './interface';
import {debugBlueveryListener} from './utils';

export class BlueveryListeners {
  publicListeners: PublicListeners = {};
  internalListeners: InternalListeners = {};

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

  removeAllSubscriptions() {
    debugBlueveryListener('remove all subscriptions');
    Object.values(this.internalListeners).forEach((listener) => {
      listener?.remove();
    });
    this.internalListeners = {};
    Object.values(this.publicListeners).forEach((subscriptions) => {
      if (subscriptions) {
        Object.values(subscriptions).forEach((listener) => {
          listener?.remove();
        });
      }
    });
    this.publicListeners = {};
  }
}
