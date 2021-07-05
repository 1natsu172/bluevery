import {RESULTS, Permission, checkMultiple} from 'react-native-permissions';
import {PERMISSIONS} from 'react-native-permissions/mock';
import {checkPermission} from './checkPermission';
import {mockPlatform} from '../../__tests__/__utils__/mockPlatform';

// Memo: react-native-permissions公式のmock実装が間違っているし(reduceの第2引数忘れ)、DENIEDのパターンも欲しいので独自に当てている。
const mockCheckMultiple = (
  resultMockPatterns: Partial<
    Record<Permission, typeof RESULTS[keyof typeof RESULTS]>
  >,
) => {
  const mockedImplement = async (permissions: Permission[]) =>
    permissions.reduce<
      Record<Permission, typeof RESULTS[keyof typeof RESULTS]>
    >(
      (acc, permission) => ({
        ...acc,
        [permission]: resultMockPatterns[permission] || RESULTS.UNAVAILABLE,
      }),
      {} as Record<Permission, typeof RESULTS[keyof typeof RESULTS]>,
    );

  (checkMultiple as jest.MockedFunction<
    typeof checkMultiple
  >).mockImplementation(mockedImplement);
};

describe('checkPermission', () => {
  test('should be throw when unsupport environment', async () => {
    mockPlatform('native', 10);
    mockCheckMultiple({
      [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'granted',
      [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]: 'granted',
    });
    await expect(checkPermission()).rejects.toThrow();
  });

  describe('iOS', () => {
    test('should be return tuple(granted & others): granted', async () => {
      mockPlatform('ios', 14);
      mockCheckMultiple({[PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL]: 'granted'});
      const checked = await checkPermission();
      expect(checked).toStrictEqual([
        [PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL],
        [],
      ]);
    });

    test('should be return tuple(granted & others): denied', async () => {
      mockPlatform('ios', 14);
      mockCheckMultiple({[PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL]: 'denied'});
      const checked = await checkPermission();
      expect(checked).toStrictEqual([
        [],
        [PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL],
      ]);
    });
  });

  describe('Android', () => {
    test('Android: should be return tuple(granted & others): both granted', async () => {
      mockPlatform('android', 10);
      mockCheckMultiple({
        [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'granted',
        [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]: 'granted',
      });
      const checked = await checkPermission();
      expect(checked).toStrictEqual([
        [
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ],
        [],
      ]);
    });

    test('Android: should be return tuple(granted & others): one side each', async () => {
      mockPlatform('android', 10);
      mockCheckMultiple({
        [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'granted',
        [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]: 'denied',
      });
      const checked = await checkPermission();
      expect(checked).toStrictEqual([
        [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION],
        [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION],
      ]);
    });

    test('Android: should be return tuple(granted & others): both not granted', async () => {
      mockPlatform('android', 10);
      mockCheckMultiple({
        [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'blocked',
        [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]: 'blocked',
      });
      const checked = await checkPermission();
      expect(checked).toStrictEqual([
        [],
        [
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
        ],
      ]);
    });
  });
});
