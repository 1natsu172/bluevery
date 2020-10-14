import {bluevery as truthExportedBluevery} from '../src/bluevery';
import {Bluevery} from '../src/bluevery/bluevery';

const mockedBluevery = jest.mock('');

// jest.mock('../src/bluevery/bluevery', () => {
//   return {
//     Bluevery: jest.fn().mockImplementation(() => {
//       return { playSoundFile: mockPlaySoundFile };
//     })
//   };
// });

// beforeEach(() => {
//   mockedBluevery
// })

describe('truthExportedBluevery', () => {
  describe('bluevery is singleton', () => {
    test('only the object', () => {
      const a = truthExportedBluevery;
      const b = truthExportedBluevery;
      expect(a === b).toBe(true);
    });
  });
});

describe('bluevery: primitive APIs', () => {
  describe('checkIsInitialized', () => {
    test.todo('should return isInitialized', () => {});
  });

  describe('forceCheckState', () => {
    test.todo('should emit on the state change.', () => {});
  });

  describe('stopBluevery', () => {
    test.todo('should reset bluevery completely ', () => {});
  });
});

describe('bluevery: commands APIs', () => {
  describe('#init', () => {
    test.todo('init only once', () => {
      // 1回しかinitできないこと
    });

    test.todo('setting userDefinedOptions', () => {});
  });

  describe('#startScan', () => {
    describe('check calls on the processing', () => {
      test.todo('should call requireCheckBeforeBleProcess', () => {});
      test.todo('should call state#onScanning', () => {});
      test.todo('should not call state#onScanning when scanning', () => {});
      test.todo('should call requireCheckBeforeBleProcess', () => {});
      test.todo('should call cleanupScan at the end of process', () => {});
    });

    describe('interval', () => {
      test.todo('should correct intervalLength', () => {});
      test.todo('should iterate the number of times', () => {});
      test.todo('should possible non iterate', () => {});
    });

    describe('discoverHandler', () => {
      test.todo('should call passed handler', () => {});
    });

    describe('matchFn', () => {
      test.todo('should discover only that match the result of matchFn', () => {
        // discoverHandlerの呼ばれる回数をモックする
      });
    });
  });
});
