import {Bluevery} from './bluevery';
import {BlueveryCore} from './blueveryCore';
import {BlueveryState} from './blueveryState';
import {BlueveryListeners} from './blueveryListeners';
import {createUseBlueveryState} from './stateProvider';

export const bluevery = new Bluevery({
  BlueveryCore,
  BlueveryState,
  blueveryListeners: new BlueveryListeners(),
});

export const useBlueveryState = createUseBlueveryState(
  // @ts-expect-error
  bluevery.__DO_NOT_DIRECT_USE_STATE__,
);

export * from './interface';
