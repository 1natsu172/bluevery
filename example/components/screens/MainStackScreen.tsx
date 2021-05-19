import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {SelectServiceScreen} from './SelectServiceScreen';
import {BleServiceScreens} from './BleServiceScreens';

const Stack = createStackNavigator();

export const MainStackScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Welcome to Bluevery"
        component={SelectServiceScreen}
      />
      {Object.entries({
        ...BleServiceScreens,
      }).map(([name, component]) => (
        <Stack.Screen name={name} component={component} />
      ))}
    </Stack.Navigator>
  );
};
