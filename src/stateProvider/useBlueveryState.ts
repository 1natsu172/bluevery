import {useSnapshot} from 'valtio';
import {State} from '../interface';

export const createUseBlueveryState = (state: State) => () =>
  useSnapshot(state);
