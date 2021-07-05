import React, {useEffect} from 'react';
import {TabView} from 'react-native-tab-view';
import {bluevery, PeripheralInfo, useBlueveryState} from 'bluevery';
import {
  ScannedPeripheralList,
  ManagingPeripheralList,
  TabViews,
} from '../../components';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {HermesAnnounce} from '../../components/HermesAnnounce';

type Props = {
  onConnectPeripheral: (peripheralInfo: PeripheralInfo) => Promise<void>;
  characteristicValues: {
    [x: string]: unknown[] | undefined;
  };
  receiveCharacteristicValueHandlers:
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

export const BaseBleServiceScreen: React.VFC<Props> = (props) => {
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
            characteristicValuesMap={props.characteristicValues}
            receiveCharacteristicHandlersMap={
              props.receiveCharacteristicValueHandlers
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
          __DEBUG: 'bluevery,bluevery:*',
          onDisconnectPeripheralHandler: (p) => {
            console.log(`${p.peripheral} is disconnected`);
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
    // propsをdepsに含めると、receiveCharacteristicValueしたときにここのeffectが走ってしまうので1回だけに絞る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.mainContentContainer}>
      <StatusBar barStyle="dark-content" />
      {/* @ts-expect-error */}
      <TabViews routes={routes} scenes={renderScene} />
      <HermesAnnounce />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContentContainer: {flex: 1},
});
