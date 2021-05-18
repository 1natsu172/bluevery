/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, StyleSheet, StatusBar, View, Button} from 'react-native';
import {useKeepAwake} from 'expo-keep-awake';
import {useErrorHandler} from 'react-error-boundary';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import {useAND_UA_651BLE, useBatteryService} from './hooks';
import {HermesAnnounce, Header} from './components';
import {BleControl} from './BleControl';

type BleDeviceType = 'UA_651BLE' | 'BatteryServiceDevice';

type SelectBleDeviceTypeProps = {
  onSelect: (type: BleDeviceType) => void;
};
const SelectBleDeviceType = (props: SelectBleDeviceTypeProps) => {
  return (
    <View>
      <Button title="UA_651BLE" onPress={() => props.onSelect('UA_651BLE')} />
      <Button
        title="BatteryServiceDevice"
        onPress={() => props.onSelect('BatteryServiceDevice')}
      />
    </View>
  );
};
const useBleController = (
  type: BleDeviceType | undefined,
  onError: (error: Error) => unknown,
) => {
  const ua_651BLE = useAND_UA_651BLE({onError});
  const batterService = useBatteryService({onError});
  switch (type) {
    case 'UA_651BLE':
      return ua_651BLE;
    case 'BatteryServiceDevice':
      return batterService;
  }
};

const App = () => {
  useKeepAwake();
  const handleError = useErrorHandler();
  const [bleDeviceType, setBleDevcieType] = React.useState<
    BleDeviceType | undefined
  >();
  const bleController = useBleController(bleDeviceType, handleError);
  return (
    <SafeAreaView style={styles.mainContentContainer}>
      <StatusBar barStyle="dark-content" />
      <Header />
      <SelectBleDeviceType onSelect={(type) => setBleDevcieType(type)} />
      {bleController && (
        <BleControl
          onError={handleError}
          onConnectPeripheral={bleController.onConnectPeripheral}
          characteristicValues={bleController.characteristicValues}
          receiveCharacteristicValueHandlers={
            bleController.receiveCharacteristicValueHandlers
          }
        />
      )}
      <HermesAnnounce />
    </SafeAreaView>
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
