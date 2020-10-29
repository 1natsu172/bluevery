import RNPermissions, {Permission, RESULTS} from 'react-native-permissions';

export async function requestPermission(
  permissions: Permission[],
): Promise<[granted: Permission[], ungranted: Permission[]]> {
  const requestedResponses = await RNPermissions.requestMultiple(permissions);

  /**
   * Android <6では対応していないため、常にgrantedになる
   * なお、 https://github.com/facebook/react-native/pull/19734 はRN0.55.6では入っていない
   */
  const results = (Object.entries(requestedResponses) as [
    Permission,
    typeof RESULTS[keyof typeof RESULTS],
  ][]).reduce<[granted: Permission[], ungranted: Permission[]]>(
    (acc, [permission, status]) => {
      const [granted, ungranted] = acc;
      if (status === 'granted') {
        granted.push(permission);
      } else {
        ungranted.push(permission);
      }
      return [granted, ungranted];
    },
    [[], []],
  );

  return results;
}
