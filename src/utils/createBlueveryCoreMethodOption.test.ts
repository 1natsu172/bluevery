import {BlueveryCoreMethodOptions} from '../interface';
import {
  createBlueveryCoreMethodOption,
  defaultBlueveryCoreMethodOptions,
} from './createBlueveryCoreMethodOption';

describe('createBlueveryCoreMethodOption', () => {
  test('should can be undefined the overwrite option', () => {
    const option = createBlueveryCoreMethodOption('connect', undefined);
    expect(option).toStrictEqual(defaultBlueveryCoreMethodOptions.connect);
  });

  test('should be merge passed options with default options', () => {
    const willBeMerged: BlueveryCoreMethodOptions['connect'] = {
      omoiyariTime: 1000,
      retryOptions: {retries: 100, randomize: true},
      timeoutOptions: {
        timeoutMilliseconds: 60000,
        timeoutMessage: 'fixture timeout message',
      },
    };

    const option = createBlueveryCoreMethodOption('connect', willBeMerged);

    expect(option.timeoutOptions).toStrictEqual(willBeMerged.timeoutOptions);
    expect(option.retryOptions).toStrictEqual({
      factor: 1,
      ...willBeMerged.retryOptions,
    });
  });

  test('Arrays should be used as passed without merging', () => {
    const willBeMerged: BlueveryCoreMethodOptions['scan'] = {
      scanningSettings: [['fixture'], 200, true],
      intervalLength: 100,
      iterations: 10,
    };

    const option = createBlueveryCoreMethodOption('scan', willBeMerged);

    expect(option.intervalLength).toStrictEqual(willBeMerged.intervalLength);
    expect(option.iterations).toStrictEqual(willBeMerged.iterations);
    expect(option.scanningSettings).toStrictEqual(
      willBeMerged.scanningSettings,
    );
  });
});
