import {EmitterSubscription} from 'react-native';
import {BlueveryListeners} from '../src/blueveryListeners';

const mockEmitterSubscription = () =>
  (({remove: jest.fn()} as unknown) as EmitterSubscription);

let blueveryListener: BlueveryListeners;
beforeEach(() => {
  blueveryListener = new BlueveryListeners();
});

describe('BlueveryListener', () => {
  describe('setAnyPublicSubscription', () => {
    test('should set any public subscription', () => {
      const mockEmitter = mockEmitterSubscription();
      blueveryListener.setAnyPublicSubscription(
        '1',
        'receivingForCharacteristicValueListener',
        mockEmitter,
      );

      expect(
        blueveryListener.publicListeners['1']
          .receivingForCharacteristicValueListener,
      ).toBe(mockEmitter);
    });
  });

  describe('setAnyInternalSubscription', () => {
    test('should set any internal subscription', () => {
      const mockEmitter = mockEmitterSubscription();
      blueveryListener.setAnyInternalSubscription(
        'disconnectPeripheralListener',
        mockEmitter,
      );

      expect(
        blueveryListener.internalListeners.disconnectPeripheralListener,
      ).toBe(mockEmitter);
    });
  });

  describe('removeAnyPublicSubscription', () => {
    test('should remove any public subscription', () => {
      const mockEmitter = mockEmitterSubscription();
      // @ts-expect-error -- testのためにreadonlyオブジェクトへ初期値設定している
      blueveryListener.publicListeners = {
        '1': {receivingForCharacteristicValueListener: mockEmitter},
      };

      expect(
        blueveryListener.publicListeners['1']
          .receivingForCharacteristicValueListener,
      ).toBe(mockEmitter);

      blueveryListener.removeAnyPublicSubscription(
        '1',
        'receivingForCharacteristicValueListener',
      );

      expect(blueveryListener.publicListeners).toStrictEqual({1: {}});
      expect(mockEmitter.remove).toBeCalledTimes(1);
    });
  });

  describe('removeAnyInternalSubscription', () => {
    test('should remove any internal subscription', () => {
      const mockEmitter = mockEmitterSubscription();
      // @ts-expect-error -- testのためにreadonlyオブジェクトへ初期値設定している
      blueveryListener.internalListeners = {
        discoverPeripheralListener: mockEmitter,
      };

      expect(
        blueveryListener.internalListeners.discoverPeripheralListener,
      ).toBe(mockEmitter);

      blueveryListener.removeAnyInternalSubscription(
        'discoverPeripheralListener',
      );

      expect(blueveryListener.internalListeners).toStrictEqual({});
      expect(mockEmitter.remove).toBeCalledTimes(1);
    });
  });

  describe('removePeripheralPublicSubscription', () => {
    test('should remove public subscription of the peripheral', () => {
      const mockEmitter1 = mockEmitterSubscription();
      const mockEmitter2 = mockEmitterSubscription();

      // @ts-expect-error -- testのためにreadonlyオブジェクトへ初期値設定している
      blueveryListener.publicListeners = {
        '1': {
          receivingForCharacteristicValueListener: mockEmitter1,
          dummyListener: mockEmitter2,
        },
      };
      expect(
        blueveryListener.publicListeners['1']
          .receivingForCharacteristicValueListener,
      ).toBe(mockEmitter1);
      // @ts-expect-error テスト用に独自にプロパティを足しているので正しい
      expect(blueveryListener.publicListeners['1'].dummyListener).toBe(
        mockEmitter2,
      );

      blueveryListener.removePeripheralPublicSubscription('1');

      expect(blueveryListener.publicListeners).toStrictEqual({});
      expect(mockEmitter1.remove).toHaveBeenCalledTimes(1);
      expect(mockEmitter2.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllSubscriptions', () => {
    test('should remove all subscription', () => {
      const mockEmitter1 = mockEmitterSubscription();
      const mockEmitter2 = mockEmitterSubscription();
      const mockEmitter3 = mockEmitterSubscription();
      const mockEmitter4 = mockEmitterSubscription();

      // @ts-expect-error -- testのためにreadonlyオブジェクトへ初期値設定している
      blueveryListener.publicListeners = {
        '1': {
          receivingForCharacteristicValueListener: mockEmitter1,
          dummyListener: mockEmitter2,
        },
      };
      // @ts-expect-error -- testのためにreadonlyオブジェクトへ初期値設定している
      blueveryListener.internalListeners = {
        disconnectPeripheralListener: mockEmitter3,
        discoverPeripheralListener: mockEmitter4,
      };

      expect(
        blueveryListener.publicListeners['1']
          .receivingForCharacteristicValueListener,
      ).toBe(mockEmitter1);
      // @ts-expect-error テスト用に独自にプロパティを足しているので正しい
      expect(blueveryListener.publicListeners['1'].dummyListener).toBe(
        mockEmitter2,
      );
      expect(
        blueveryListener.internalListeners.disconnectPeripheralListener,
      ).toBe(mockEmitter3);
      expect(
        blueveryListener.internalListeners.discoverPeripheralListener,
      ).toBe(mockEmitter4);

      blueveryListener.removeAllSubscriptions();

      expect(blueveryListener.internalListeners).toStrictEqual({});
      expect(blueveryListener.publicListeners).toStrictEqual({});
      expect(mockEmitter1.remove).toHaveBeenCalledTimes(1);
      expect(mockEmitter2.remove).toHaveBeenCalledTimes(1);
      expect(mockEmitter3.remove).toHaveBeenCalledTimes(1);
      expect(mockEmitter4.remove).toHaveBeenCalledTimes(1);
    });
  });
});
