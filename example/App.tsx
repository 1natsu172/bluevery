/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */
import 'react-native-gesture-handler';
import React from 'react';
import {useKeepAwake} from 'expo-keep-awake';
import {MainStackScreen} from './components';
import {NavigationContainer} from '@react-navigation/native';

const App = () => {
  useKeepAwake();
  return (
    <NavigationContainer>
      <MainStackScreen />
    </NavigationContainer>
  );
};

export default App;
