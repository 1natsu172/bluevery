import {BlueveryMethodOptions} from '../interface';
import {
  createBlueveryMethodOption,
  defaultBlueveryMethodOptions,
} from './createBlueveryMethodOption';

describe('createBlueveryMethodOption', () => {
  test('should can be undefined the overwrite option', () => {
    const option = createBlueveryMethodOption('connect', undefined);
    expect(option).toStrictEqual(defaultBlueveryMethodOptions.connect);
  });

  test('should be merge passed options with default options', () => {
    const willBeMerged: BlueveryMethodOptions['connect'] = {
      retryOptions: {retries: 100, randomize: true},
      timeoutOptions: {
        timeoutMilliseconds: 60000,
        timeoutMessage: 'fixture timeout message',
      },
    };

    const option = createBlueveryMethodOption('connect', willBeMerged);

    expect(option.timeoutOptions).toStrictEqual(willBeMerged.timeoutOptions);
    expect(option.retryOptions).toStrictEqual({
      factor: 1,
      ...willBeMerged.retryOptions,
    });
  });

  test('Arrays should be used as passed without merging', () => {
    const willBeMerged: BlueveryMethodOptions['scan'] = {
      scanningSettings: [['fixture'], 200, true],
      intervalLength: 100,
      iterations: 10,
    };

    const option = createBlueveryMethodOption('scan', willBeMerged);

    expect(option.intervalLength).toStrictEqual(willBeMerged.intervalLength);
    expect(option.iterations).toStrictEqual(willBeMerged.iterations);
    expect(option.scanningSettings).toStrictEqual(
      willBeMerged.scanningSettings,
    );
  });
});
