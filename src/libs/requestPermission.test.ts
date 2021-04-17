import {
  PERMISSIONS,
  RESULTS,
  Permission,
  requestMultiple,
} from 'react-native-permissions';
import {requestPermission} from './requestPermission';

// FIXME react-native-permissions公式のmock実装が間違っているのでパッチしている。
(requestMultiple as jest.MockedFunction<
  typeof requestMultiple
>).mockImplementation(async (permissions: Permission[]) =>
  permissions.reduce<Record<Permission, typeof RESULTS[keyof typeof RESULTS]>>(
    (acc, permission) => ({
      ...acc,
      [permission]:
        permission === PERMISSIONS.IOS.FACE_ID
          ? RESULTS.DENIED
          : RESULTS.GRANTED,
    }),
    {} as Record<Permission, typeof RESULTS[keyof typeof RESULTS]>,
  ),
);

describe('requestPermission', () => {
  test('should be return tuple of granted & ungranted', async () => {
    const requeted = await requestPermission([
      PERMISSIONS.IOS.FACE_ID,
      PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    ]);
    expect(requeted).toStrictEqual([
      [
        PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      ],
      [PERMISSIONS.IOS.FACE_ID],
    ]);
  });
});
