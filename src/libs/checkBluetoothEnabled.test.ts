import {NativeEventEmitter} from 'react-native';
import BleManager from 'react-native-ble-manager';
import {flushPromisesAdvanceTimersToNextTimer} from '../../__tests__/__utils__/flushPromisesAdvanceTimersToNextTimer';
import {
  getBluetoothPowerState,
  checkBluetoothEnabled,
} from './checkBluetoothEnabled';

const nativeEventEmitter = new NativeEventEmitter();

beforeEach(() => {
  jest.useFakeTimers();
});

describe('getBluetoothPowerState', () => {
  test('should be resolve: on', async () => {
    const ret = getBluetoothPowerState();
    nativeEventEmitter.emit('BleManagerDidUpdateState', {state: 'on'});
    await expect(ret).resolves.toBe('on');
  });
  test('should be resolve: off', async () => {
    const ret = getBluetoothPowerState();
    nativeEventEmitter.emit('BleManagerDidUpdateState', {state: 'on'});
    await expect(ret).resolves.toBe('on');
  });
  test('should be reject: other than on and off', async () => {
    // @ts-expect-error
    BleManager.checkState.mockImplementation(() => {
      nativeEventEmitter.emit('BleManagerDidUpdateState', {
        state: 'others',
      });
    });
    const ret = getBluetoothPowerState();
    await expect(ret).rejects.toThrow('others');
  });
});

describe('checkBluetoothEnabled', () => {
  test('should be return true, when on', async () => {
    // @ts-expect-error
    BleManager.checkState.mockImplementation(() => {
      nativeEventEmitter.emit('BleManagerDidUpdateState', {
        state: 'on',
      });
    });
    const ret = checkBluetoothEnabled();
    await expect(ret).resolves.toBe(true);
  });

  describe('should be return false, when othor than on', () => {
    const onFailed = jest.fn(() => {
      flushPromisesAdvanceTimersToNextTimer();
    });

    test('should be return false when state is off', async () => {
      // @ts-expect-error
      BleManager.checkState.mockImplementation(() => {
        nativeEventEmitter.emit('BleManagerDidUpdateState', {
          state: 'off',
        });
      });
      const ret = checkBluetoothEnabled({
        retryOptions: {retries: 5, factor: 1, onFailedAttempt: onFailed},
      });
      await expect(ret).resolves.toBe(false);
    });

    test('should be return false when state is disable', async () => {
      // @ts-expect-error
      BleManager.checkState.mockImplementation(() => {
        nativeEventEmitter.emit('BleManagerDidUpdateState', {
          state: 'disable',
        });
      });
      const ret = checkBluetoothEnabled({
        retryOptions: {
          retries: 5,
          factor: 1,
          onFailedAttempt: onFailed,
        },
      });

      await expect(ret).resolves.toBe(false);
    });
    test('should be return false when state is any', async () => {
      // @ts-expect-error
      BleManager.checkState.mockImplementation(() => {
        nativeEventEmitter.emit('BleManagerDidUpdateState', {
          state: 'hoge',
        });
      });
      const ret = checkBluetoothEnabled({
        retryOptions: {
          retries: 5,
          factor: 1,
          onFailedAttempt: onFailed,
        },
      });

      await expect(ret).resolves.toBe(false);
    });
  });
});
