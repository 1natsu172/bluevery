import debug from 'debug';

export const enableToDebug = (wildcard: string = '') => {
  debug.enable(wildcard);
};

export const debugBluevery = debug('bluevery');
export const debugBlueveryCore = debugBluevery.extend('core');
export const debugBlueveryState = debugBluevery.extend('state');
export const debugBlueveryListener = debugBluevery.extend('listener');
