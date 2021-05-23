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
import {MainStack} from '../navigations';
import {NavigationContainer} from '@react-navigation/native';

const Main = () => {
  useKeepAwake();
  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
};

export default Main;
