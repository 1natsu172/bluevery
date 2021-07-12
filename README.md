[![codecov](https://codecov.io/gh/1natsu172/bluevery/branch/master/graph/badge.svg?token=YSUJFHKCW3)](https://codecov.io/gh/1natsu172/bluevery)

# Bluevery

The ble communicate utility on react-native.

**This library is a wrapper library that uses [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager).**

## Noteworthy Features

* Wrapping procedural processes in implicit knowledge
* Manages and provides the state required for BLE connectivity
* Allows developers to implement hooks on a per-peripheral basis
* Extensive options to mitigate BLE connection failures
  * Retries, timeouts and useful callbacks etc...

## setup

```
$ yarn add bluevery
```

and **don't forget** install peerDependencies

**[See peerDependencies](./package.json)**

### for Android

Edit your app `AndroidManifest.xml`

`AndroidManifest.xml`

```
  <!-- 🚨 Keep only the permissions used in your app 🚨 -->
  <uses-permission android:name="android.permission.BLUETOOTH"/>
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <!-- 🚨 Keep only the permissions used in your app 🚨 -->
```

### for iOS

Edit your app `Podfile` then run `pod install`

`Podfile`

```
target 'YourAppProject' do

  # add the below

  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-BluetoothPeripheral', :path => "#{permissions_path}/BluetoothPeripheral"
  pod 'Permission-LocationWhenInUse', :path => "#{permissions_path}/LocationWhenInUse"
  pod 'Permission-Notifications', :path => "#{permissions_path}/Notifications"

end
```

Edit your app `Info.plist`

`Info.plist`

```
  <!-- 🚨 Keep only the permissions used in your app 🚨 -->
	<key>NSBluetoothAlwaysUsageDescription</key>
	<string>EDIT YOUR TEXT</string>
	<key>NSBluetoothPeripheralUsageDescription</key>
	<string>EDIT YOUR TEXT</string>
	<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
	<string>EDIT YOUR TEXT</string>
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>EDIT YOUR TEXT</string>
  <!-- 🚨 Keep only the permissions used in your app 🚨 -->
```

## Usage

### Call init

bluevery is a singleton. First of all, please run init in your application.

```typescript
import { bluevery } from 'bluevery'

await bluevery.init({
  __DEBUG: 'bluevery,bluevery:*',
});
```

### Write procedural processes for your target peripheral

The recommendation is to create hooks for each peripheral. Please refer to the [example hooks](https://github.com/1natsu172/bluevery/blob/master/example/src/screens/BleServiceScreens/hooks).

### useBlueveryState

bluevery manages and provides the necessary state for ble connection. You can use the state in a hooks style (State is read-only).

```typescript
import { useBlueveryState } from 'bluevery';

const MyBleScreen: React.VFC<Props> = (props) => {
  const bleState = useBlueveryState();

  return {
    // your JSX
  }
}
```

[See the following interface for state definitions](https://github.com/1natsu172/bluevery/blob/master/src/interface.ts#L38-L49).

### CAVEAT

bluevery is only able to wrap some methods of react-native-ble-manager.

If there are any methods you need, implement them in bluevery. Please contribute! Or use the original react-native-ble-manager as an interim process without bluevery!

## Output debug log for development

Pass the debug namespace into the init options.

https://github.com/visionmedia/debug#environment-variables

```javascript
await bluevery.init({
  __DEBUG: 'bluevery,bluevery:*',
  // ...other options
})
```

### Be careful with the production environment

It is recommended that do not log in the production. You should avoid memory leaks and unnecessary process on users' client.

```javascript
await bluevery.init({
  __DEBUG: IS_DEVELOPMENT ? 'bluevery,bluevery:*' : undefined,
  // ...other options
})
```
