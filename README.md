[![codecov](https://codecov.io/gh/1natsu172/bluevery/branch/master/graph/badge.svg?token=YSUJFHKCW3)](https://codecov.io/gh/1natsu172/bluevery)

# Bluevery

The ble communicate utility on react-native.

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
  pod 'Permission-BluetoothPeripheral', :path => "#{permissions_path}/BluetoothPeripheral.podspec"
  pod 'Permission-LocationWhenInUse', :path => "#{permissions_path}/LocationWhenInUse.podspec"
  pod 'Permission-Notifications', :path => "#{permissions_path}/Notifications.podspec"

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