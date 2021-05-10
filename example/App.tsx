/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useKeepAwake} from 'expo-keep-awake';
import {useErrorHandler} from 'react-error-boundary';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {bluevery, PeripheralInfo, useBlueveryState} from 'bluevery';
import {
  HermesAnnounce,
  Header,
  ScannedPeripheralList,
  TabViews,
} from './components';
import {SceneMap, TabView} from 'react-native-tab-view';

export const BP_MONITOR_NAME_AND = 'A&D_UA-651BLE';
export const BP_SERVICE_UUID = '1810';
/**
 * BLE(GATT)のキャラクタリスティックUUID: タイムスタンプ
 */
export const BP_DATETIME_CHARECTERISTIC_UUID = '2a08';
/**
 * BLE(GATT)のキャラクタリスティックUUID: 血圧測定データ
 */
export const BP_MEASUREMENT_CHARECTERISTIC_UUID = '2a35';

/**
 * Dateを以下の形式のbyte arrayに変換する
 * |year (16bit)|month(8bit)|day(8bit)|hours(8bit)|minutes(8bit)|seconds(8bit)|
 */
export const timeToByteArray = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const yearData = new Uint8Array(new Uint16Array([year]).buffer); // 16bit -> 8bit array

  const otherData = new Uint8Array([month, day, hours, minutes, seconds]);
  return [...Array.from(yearData), ...Array.from(otherData)];
};
const A = () => <View style={{flex: 1, backgroundColor: '#ff4081'}} />;

const App = () => {
  useKeepAwake();
  const handleError = useErrorHandler();

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
            peripheralsMap={bleState.scannedPeripherals}
            onPress={onConnectPeripheral}
          />
        );
      case 'second':
        return (
          <ScannedPeripheralList
            peripheralsMap={bleState.scannedPeripherals}
            onPress={onConnectPeripheral}
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
            scanningSettings: [[], 1, true],
            intervalLength: 1000,
            iterations: 5,
          },
          // discoverHandler: (peripheral) => {
          //   console.log('discovered peripheral', peripheral);
          // },
          // matchFn: (p) => !!p.id.match(new RegExp(/^BP_SERVICE_UUID/)),
        });
        // return () => {
        //   TODO: implements cleanup scan methos
        // }
      } catch (error) {
        handleError(error);
      }
    };
    initAndScan();
  }, []);
  const onReceiveCharacteristicValue = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      try {
        await bluevery.receiveCharacteristicValue({
          onCallBeforeStartNotification: async () => {
            await bluevery.connect({
              connectParams: [peripheralInfo.id],
              retrieveServicesParams: [peripheralInfo.id],
              retrieveServicesOptions: {
                retryOptions: {retries: 15},
                timeoutOptions: {timeoutMilliseconds: 10000},
              },
              bondingParams: [peripheralInfo.id, peripheralInfo.id],
            });
            await bluevery.writeValue({
              writeValueParams: [
                peripheralInfo.id,
                BP_SERVICE_UUID,
                BP_DATETIME_CHARECTERISTIC_UUID,
                timeToByteArray(new Date()),
              ],
              retrieveServicesParams: [peripheralInfo.id],
            });
            await bluevery.readValue({
              readValueParams: [
                peripheralInfo.id,
                BP_SERVICE_UUID,
                BP_DATETIME_CHARECTERISTIC_UUID,
              ],
              retrieveServicesParams: [peripheralInfo.id],
            });
          },
          scanParams: {
            scanOptions: {
              scanningSettings: [[], 1, true],
            },
          },
          retrieveServicesParams: [peripheralInfo.id],
          retrieveServicesOptions: {
            retryOptions: {retries: 15},
            timeoutOptions: {timeoutMilliseconds: 10000},
          },
          startNotificationParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_MEASUREMENT_CHARECTERISTIC_UUID,
          ],
          receiveCharacteristicHandler: (res) => {
            console.log({...res});
          },
        });
      } catch (error) {
        handleError(error);
      }
    },
    [],
  );
  const onConnectPeripheral = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      try {
        await bluevery.connect({
          connectParams: [peripheralInfo.id],
          retrieveServicesParams: [peripheralInfo.id],
          bondingParams: [peripheralInfo.id, peripheralInfo.id],
        });
        await bluevery.writeValue({
          writeValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_DATETIME_CHARECTERISTIC_UUID,
            timeToByteArray(new Date()),
          ],
          retrieveServicesParams: [peripheralInfo.id],
        });
        await bluevery.readValue({
          readValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_DATETIME_CHARECTERISTIC_UUID,
          ],
          retrieveServicesParams: [peripheralInfo.id],
        });
      } catch (error) {
        handleError(error);
      }
    },
    [],
  );

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Header />

      <SafeAreaView style={styles.mainContentContainer}>
        {/* @ts-expect-error */}
        <TabViews routes={routes} scenes={renderScene} />
      </SafeAreaView>
      <HermesAnnounce />
    </>
  );
};

const styles = StyleSheet.create({
  mainContentContainer: {flex: 1},
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
