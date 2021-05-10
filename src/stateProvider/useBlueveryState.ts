import {useSnapshot} from 'valtio';
import {Store} from '../interface';

/**
 * @description store must be a reference to a single proxy object
 */
export const createUseBlueveryState = (store: Store) => () =>
  useSnapshot(store.bluevery);
