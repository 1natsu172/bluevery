/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import BleManager from 'react-native-ble-manager';

AppRegistry.registerComponent(appName, () => App);
