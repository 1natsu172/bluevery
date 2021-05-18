import React, {useEffect} from 'react';
import {TabView} from 'react-native-tab-view';

import {bluevery, PeripheralInfo, useBlueveryState} from 'bluevery';
import {
  ScannedPeripheralList,
  ManagingPeripheralList,
  TabViews,
} from './components';

type Props = {
  onConnectPeripheral: (peripheralInfo: PeripheralInfo) => Promise<void>;
  characteristicValuesMap: {
    [x: string]: unknown[] | undefined;
  };
  receiveCharacteristicHandlersMap:
    | undefined
    | {
        [x: string]:
          | {
              name: string;
              onReceiveCharacteristicValue: (
                peripheralInfo: PeripheralInfo,
              ) => Promise<void>;
            }
          | undefined;
      };
  onError: (error: Error) => void;
};

export const BleControl: React.VFC<Props> = (props) => {
  const bleState = useBlueveryState();

  const routes = React.useMemo(
    () => [
      {key: 'first', title: 'Scanned'},
      {key: 'second', title: 'Managed'},
    ],
    [],
  );
  const renderScene: Parameters<typeof TabView>['0']['renderScene'] = ({
    route,
  }) => {
    switch (route.key) {
      case 'first':
        return (
          <ScannedPeripheralList
            isScanning={bleState.scanning}
            peripheralsMap={bleState.scannedPeripherals}
            onConnect={props.onConnectPeripheral}
            onRefresh={async () =>
              await bluevery.startScan({
                scanOptions: {
                  // scanningSettings: [[BP_SERVICE_UUID], 1, true],
                  scanningSettings: [
                    [],
                    3,
                    true,
                    // {reportDelay: 0, scanMode: 2},
                  ],
                  intervalLength: 1000,
                  iterations: 5,
                },
                // discoverHandler: (peripheral) => {
                //   console.log('discovered peripheral', peripheral);
                // },
                // matchFn: (p) => !!p.id.match(new RegExp(/^BP_SERVICE_UUID/)),
              })
            }
          />
        );
      case 'second':
        return (
          <ManagingPeripheralList
            peripheralsMap={bleState.managingPeripherals}
            characteristicValuesMap={props.characteristicValuesMap}
            receiveCharacteristicHandlersMap={
              props.receiveCharacteristicHandlersMap
            }
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const initAndScan = async () => {
      try {
        await bluevery.init({
          onDisconnectPeripheralHandler: (p) => {
            console.log(`${p.peripheral} is dosconnected`);
          },
        });
        await bluevery.startScan({
          scanOptions: {
            // scanningSettings: [[BP_SERVICE_UUID], 1, true],
            scanningSettings: [[], 3, true],
            intervalLength: 1000,
            iterations: 5,
          },
          // discoverHandler: (peripheral) => {
          //   console.log('discovered peripheral', peripheral);
          // },
          // matchFn: (p) => !!p.id.match(new RegExp(/^BP_SERVICE_UUID/)),
        });
      } catch (error) {
        props.onError(error);
      }
    };
    initAndScan();
    return () => {
      console.log('cleanup: initAndScan');
      bluevery.stopBluevery();
    };
  }, []);

  /* @ts-expect-error */
  return <TabViews routes={routes} scenes={renderScene} />;
};
