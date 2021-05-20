import {Peripheral} from 'react-native-ble-manager';
import {PeripheralInfo} from '../../interface';
import {
  createHandleDiscoverPeripheral,
  createPeripheralInfoHandler,
  onDiscoverPeripheral,
  // registerDiscoverPeripheralListener,
} from './registerDiscoverPeripheralListener';

const samplePeripheral: Peripheral = {
  name: 'veryvery',
  id: '42',
  rssi: 42,
  advertising: {isConnectable: true},
};
const sampleUnknownPeripheral: Peripheral = {
  id: '42',
  rssi: 42,
  advertising: {isConnectable: true},
};
const samplePeripheralInfo: PeripheralInfo = {
  name: 'veryvery',
  id: '42',
  rssi: 42,
  advertising: {isConnectable: true},
};
// NOTE:FIXME: 使ってないけど用意だけしておきたいのでignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sampleUnknownPeripheralInfo: PeripheralInfo = {
  id: '42',
  rssi: 42,
  advertising: {isConnectable: true},
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createPeripheralInfoHandler,', () => {
  const setPeripheralToScannedPeripherals = jest.fn();
  const handlePeripheralInfo = jest.fn();

  test('should call passed functions', () => {
    const handler = createPeripheralInfoHandler({
      setPeripheralToScannedPeripherals,
      handlePeripheralInfo,
    });
    handler(samplePeripheralInfo);
    expect(setPeripheralToScannedPeripherals).toBeCalledTimes(1);
    expect(handlePeripheralInfo).toBeCalledTimes(1);
  });
  test('should handlePeripheralInfo is optional', () => {
    const handler = createPeripheralInfoHandler({
      setPeripheralToScannedPeripherals,
    });
    handler(samplePeripheralInfo);
    expect(setPeripheralToScannedPeripherals).toBeCalledTimes(1);
    expect(handlePeripheralInfo).not.toBeCalled();
  });
});

describe('onDiscoverPeripheral,', () => {
  const peripheralInfoHandler = jest.fn();

  test('should call passed functions', () => {
    onDiscoverPeripheral(samplePeripheral, peripheralInfoHandler);
    expect(peripheralInfoHandler).toBeCalledTimes(1);
  });

  describe('process Peripheral to PeripheralInfo', () => {
    test('if Peripheral name is undefined, should peripheralInfo name process', () => {
      onDiscoverPeripheral(sampleUnknownPeripheral, peripheralInfoHandler);
      expect(peripheralInfoHandler).toBeCalledWith(
        expect.objectContaining({
          name: expect.any(String),
        }),
      );
    });
  });
});

describe('createHandleDiscoverPeripheral,', () => {
  const mockedOnDiscoverPeripheral = jest.fn();
  const peripheralInfoHandler = jest.fn();
  const matchFn = jest.fn();
  describe('called function', () => {
    test('should call passed functions', () => {
      const handler = createHandleDiscoverPeripheral(
        mockedOnDiscoverPeripheral,
        {
          matchFn: matchFn.mockImplementationOnce(() => true),
          peripheralInfoHandler,
        },
      );
      handler(samplePeripheral);
      expect(matchFn).toBeCalledTimes(1);
      expect(mockedOnDiscoverPeripheral).toBeCalledTimes(1);
    });

    test('should matchFn is optional', () => {
      const handler = createHandleDiscoverPeripheral(
        mockedOnDiscoverPeripheral,
        {
          peripheralInfoHandler,
        },
      );
      handler(samplePeripheral);
      expect(matchFn).not.toBeCalled();
    });
  });
  describe('matchFn', () => {
    test('if matchFn returned false, should not call onDiscoverPeripheral', () => {
      const handler = createHandleDiscoverPeripheral(
        mockedOnDiscoverPeripheral,
        {
          matchFn: matchFn.mockImplementationOnce(() => false),
          peripheralInfoHandler,
        },
      );
      handler(samplePeripheral);
      expect(mockedOnDiscoverPeripheral).not.toBeCalledTimes(1);
    });
    test('if matchFn returned true, should call onDiscoverPeripheral', () => {
      const handler = createHandleDiscoverPeripheral(
        mockedOnDiscoverPeripheral,
        {
          matchFn: matchFn.mockImplementationOnce(() => true),
          peripheralInfoHandler,
        },
      );
      handler(samplePeripheral);
      expect(mockedOnDiscoverPeripheral).toBeCalledTimes(1);
    });
  });
});

describe('registerDiscoverPeripheralListener,', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('covered by integration', () => {});
});
