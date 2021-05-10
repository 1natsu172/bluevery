import {Bluevery} from './bluevery';
import {BlueveryCore} from './blueveryCore';
import {BlueveryState, createInitialState} from './blueveryState';
import {BlueveryListeners} from './blueveryListeners';
import {createUseBlueveryState} from './stateProvider';
import {proxy} from 'valtio';

export const bluevery = new Bluevery({
  BlueveryCore,
  BlueveryState,
  blueveryListeners: new BlueveryListeners(),
  store: proxy({bluevery: createInitialState()}),
});

export const useBlueveryState = createUseBlueveryState(
  // @ts-expect-error
  bluevery.__DO_NOT_DIRECT_USE_STORE__,
);

export * from './interface';
