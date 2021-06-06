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
});
