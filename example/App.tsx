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
import {SafeAreaView, StyleSheet, StatusBar} from 'react-native';
import {useKeepAwake} from 'expo-keep-awake';
import {useErrorHandler} from 'react-error-boundary';
import {TabView} from 'react-native-tab-view';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import {bluevery, useBlueveryState} from 'bluevery';
import {useAND_UA_651BLE} from './hooks';
import {
  HermesAnnounce,
  Header,
  ScannedPeripheralList,
  ManagingPeripheralList,
  TabViews,
} from './components';

const App = () => {
  useKeepAwake();
  const handleError = useErrorHandler();
  const bleState = useBlueveryState();
  const {
    characteristicValues,
    onConnectPeripheral,
    receiveCharacteristicValueHandlers,
  } = useAND_UA_651BLE({onError: handleError});

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
            onConnect={onConnectPeripheral}
            onRefresh={async () =>
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
              })
            }
          />
        );
      case 'second':
        return (
          <ManagingPeripheralList
            peripheralsMap={bleState.managingPeripherals}
            characteristicValuesMap={characteristicValues}
            receiveCharacteristicHandlersMap={
              receiveCharacteristicValueHandlers
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
            scanningSettings: [[], 1, true],
            intervalLength: 1000,
            iterations: 5,
          },
          // discoverHandler: (peripheral) => {
          //   console.log('discovered peripheral', peripheral);
          // },
          // matchFn: (p) => !!p.id.match(new RegExp(/^BP_SERVICE_UUID/)),
        });
      } catch (error) {
        handleError(error);
      }
    };
    initAndScan();
    return () => {
      console.log('cleanup: initAndScan');
      bluevery.stopBluevery();
    };
  }, []);

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
