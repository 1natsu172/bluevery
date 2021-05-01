import {Platform, PlatformOSType} from 'react-native';

/**
 * mock util for Platform
 */
export const mockPlatform = (OS: PlatformOSType, version: number | string) => {
  jest.resetModules();
  jest.doMock(
    'react-native/Libraries/Utilities/Platform',
    (): Partial<typeof Platform> => ({
      OS: OS as 'ios',
      select: (objs) => objs[OS],
      Version: version || undefined,
    }),
  );
};
