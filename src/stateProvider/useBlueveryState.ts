import {useProxy} from 'valtio';
import {State} from '../interface';

export const createUseBlueveryState = (state: State) => () => useProxy(state);
