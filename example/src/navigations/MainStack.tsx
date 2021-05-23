import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {SelectServiceScreen, BleServiceScreens} from '../screens';

const Stack = createStackNavigator();

export const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Welcome to Bluevery"
        component={SelectServiceScreen}
      />
      {Object.entries({
        ...BleServiceScreens,
      }).map(([name, component]) => (
        <Stack.Screen key={name} name={name} component={component} />
      ))}
    </Stack.Navigator>
  );
};
