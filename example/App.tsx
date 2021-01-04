/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useEffect} from 'react';
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

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {bluevery, PeripheralInfo, State as BlueveryState} from 'bluevery';
import {useState} from 'react';
import {useCallback} from 'react';

declare const global: {HermesInternal: null | {}};
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

const App = () => {
  const [bleState, setBleState] = useState<BlueveryState>();

  useEffect(() => {
    const blue = async () => {
      if (!bluevery.checkIsInitialized()) {
        bluevery.init({
          onDisconnectPeripheralHandler: (p) => {
            console.log(`${p.peripheral} is dosconnected`);
          },
        });
      }
      bluevery.listeners.stateListener.on((state) => {
        setBleState(JSON.parse(JSON.stringify(state)));
        console.log('state', JSON.parse(JSON.stringify(state)));
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
      //   cleanup
      // }
    };
    blue();
  }, []);
  const receiveCharacteristicValue = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      await bluevery.receiveCharacteristicValue({
        scanParams: {
          scanOptions: {
            scanningSettings: [[], 1, true],
          },
        },
        connectParams: {connectParams: [peripheralInfo.id]},
        retrieveServicesParams: {retrieveServicesParams: [peripheralInfo.id]},
        bondingParams: {
          createBondParams: [peripheralInfo.id, peripheralInfo.id],
        },
        readValueParams: {
          readValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_DATETIME_CHARECTERISTIC_UUID,
          ],
        },
        writeValueParams: {
          writeValueParams: [
            peripheralInfo.id,
            BP_SERVICE_UUID,
            BP_DATETIME_CHARECTERISTIC_UUID,
            timeToByteArray(new Date()),
          ],
        },
        startNotificationParams: [
          peripheralInfo.id,
          BP_SERVICE_UUID,
          BP_MEASUREMENT_CHARECTERISTIC_UUID,
        ],
      });
    },
    [],
  );
  const onSelectPeripheral = useCallback(
    async (peripheralInfo: PeripheralInfo) => {
      await bluevery.connect({
        connectParams: {connectParams: [peripheralInfo.id]},
        retrieveServicesParams: {retrieveServicesParams: [peripheralInfo.id]},
        bondingParams: {
          createBondParams: [peripheralInfo.id, peripheralInfo.id],
        },
      });
      await receiveCharacteristicValue(peripheralInfo);
    },
    [receiveCharacteristicValue],
  );

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}
          <FlatList
            ListEmptyComponent={() => <Text>no list</Text>}
            data={bleState ? Object.values(bleState?.scannedPeripherals) : null}
            renderItem={({item}) => (
              <TouchableOpacity
                style={{marginBottom: 10}}
                key={item.id}
                onPress={() => onSelectPeripheral(item)}>
                <Text>{`${item.name}`}</Text>
                <Text>{`${item.id}`}</Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Step One</Text>
              <Text style={styles.sectionDescription}>
                Edit <Text style={styles.highlight}>App.tsx</Text> to change
                this screen and then come back to see your edits.
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>See Your Changes</Text>
              <Text style={styles.sectionDescription}>
                <ReloadInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Debug</Text>
              <Text style={styles.sectionDescription}>
                <DebugInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text style={styles.sectionDescription}>
                Read the docs to discover what to do next:
              </Text>
            </View>
            <LearnMoreLinks />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
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
