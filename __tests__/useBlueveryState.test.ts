import {renderHook, act} from '@testing-library/react-hooks';
import {createInitialState} from '../src/blueveryState';
import {bluevery, useBlueveryState} from '../src/index';

describe('createUseBlueveryState', () => {
  beforeEach(async () => {
    await bluevery.init({initialState: createInitialState()});
  });
  afterEach(() => {
    // @ts-expect-error
    bluevery.core.state.resetState();
  });

  test(`should re-render by changed blueverState`, () => {
    const {result, rerender} = renderHook(() => useBlueveryState());

    expect(result.current.scanning).toBe(false);

    act(() => {
      // @ts-expect-error testのためにprivateプロパティに直接アクセスしている
      bluevery.core.state.onScanning();
    });
    rerender();

    expect(result.current.scanning).toBe(true);
  });

  test('should respond correctly even after reInit', () => {
    const {result, rerender} = renderHook(() => useBlueveryState());

    /**
     * 普通にstateの変更の反映をtest
     */
    act(() => {
      // @ts-expect-error testのためにprivateプロパティに直接アクセスしている
      bluevery.core.state.onScanning();
    });
    rerender();

    expect(result.current.scanning).toBe(true);

    ///////////////////////////////////////////////////////////////

    /**
     * reInitしたタイミングでre-renderしてstateの変更の反映が行われるかtesting
     */
    act(() => {
      // @ts-expect-error testのためにprivateプロパティに直接アクセスしている
      bluevery.core.state.reInitState(
        createInitialState({
          managingPeripherals: {
            hooksTestingKey1: {id: 'hooksTesting1', rssi: 1, advertising: {}},
          },
        }),
      );
    });
    rerender();

    expect(result.current.managingPeripherals.hooksTestingKey1.id).toBe(
      'hooksTesting1',
    );
    expect(result.current.scanning).toBe(false);

    ///////////////////////////////////////////////////////////////

    /**
     * reInit後も問題なくstateの変更が反映されるかをtesting
     */
    act(() => {
      // @ts-expect-error testのためにprivateプロパティに直接アクセスしている
      bluevery.core.state.onScanning();
    });
    rerender();

    expect(result.current.scanning).toBe(true);
  });
});
