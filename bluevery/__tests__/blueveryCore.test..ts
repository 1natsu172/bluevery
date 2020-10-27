describe.skip('BlueveryCore', () => {
  describe('scan', () => {
    describe('check calls on the processing', () => {
      test.skip('should call requireCheckBeforeBleProcess', () => {});
      test.skip('should call state#onScanning', () => {});
      test.skip('should not call state#onScanning when scanning', () => {});
      test.skip('should call cleanupScan at the end of process', () => {});
    });

    describe('discoverHandler', () => {
      test.skip('should call passed handler', () => {});
    });

    describe('matchFn', () => {
      test.skip('should discover only that match the result of matchFn', () => {
        // discoverHandlerの呼ばれる回数をモックする
      });
    });
  });
});
