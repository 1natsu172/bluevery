export function flushPromisesAdvanceTimersToNextTimer(byTime?: number) {
  // Wait for promises running in the non-async timer callback to complete.
  // From https://stackoverflow.com/a/58716087/308237
  // micro-task hack on jest
  return new Promise((resolve) => setImmediate(resolve)).then(() => {
    jest.advanceTimersToNextTimer();
    if (byTime) {
      jest.advanceTimersByTime(byTime);
    }
  });
}
