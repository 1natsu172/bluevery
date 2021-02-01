import {Bluevery} from './bluevery';
import {BlueveryCore} from './blueveryCore';
import {BlueveryState} from './blueveryState';
import {createUseBlueveryState} from './stateProvider';

export const bluevery = new Bluevery({BlueveryCore, BlueveryState});

export const useBlueveryState = createUseBlueveryState(
  bluevery.__DO_NOT_DIRECT_USE_STATE__,
);

export * from './interface';
