import debug from 'debug';
import {
  debugBluevery,
  debugBlueveryCore,
  debugBlueveryListener,
  debugBlueveryState,
  enableToDebug,
} from './debugLog';

describe('debugLog', () => {
  test('should enable through enableToDebug', () => {
    expect(debug.enabled('fixture')).toBe(false);
    enableToDebug('fixture');
    expect(debug.enabled('fixture')).toBe(true);
  });

  test('should debug by debugBluevery', () => {
    let message = [];
    debugBluevery.log = (msg) => message.push(msg);
    debug.enable('bluevery');
    debugBluevery('test1');
    expect(message).toEqual(
      expect.arrayContaining([expect.stringContaining('test1')]),
    );
  });

  test('should debug by debugBlueveryCore', () => {
    let message = [];
    debugBlueveryCore.log = (msg) => message.push(msg);
    debug.enable('bluevery:core');
    debugBlueveryCore('test1');
    expect(message).toEqual(
      expect.arrayContaining([expect.stringContaining('test1')]),
    );
  });

  test('should debug by debugBlueveryState', () => {
    let message = [];
    debugBlueveryState.log = (msg) => message.push(msg);
    debug.enable('bluevery:state');
    debugBlueveryState('test1');
    expect(message).toEqual(
      expect.arrayContaining([expect.stringContaining('test1')]),
    );
  });

  test('should debug by debugBlueveryListener', () => {
    let message = [];
    debugBlueveryListener.log = (msg) => message.push(msg);
    debug.enable('bluevery:listener');
    debugBlueveryListener('test1');
    expect(message).toEqual(
      expect.arrayContaining([expect.stringContaining('test1')]),
    );
  });
});
