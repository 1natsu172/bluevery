export function flushPromisesAdvanceTimer(ms: number) {
  // Wait for promises running in the non-async timer callback to complete.
  // From https://stackoverflow.com/a/58716087/308237
  return new Promise((resolve) => setImmediate(resolve)).then(() =>
    jest.advanceTimersByTime(ms),
  );
}
