import {useNavigation} from '@react-navigation/core';
import React from 'react';
import {SafeAreaView, StyleSheet, StatusBar, Button} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {HermesAnnounce} from '../';
import {BleServiceScreens} from './BleServiceScreens';

// ES6 以降は Object.getOwnPropertyNames は定義順で保証される
const ServiceNames = Object.getOwnPropertyNames(BleServiceScreens);

export const SelectServiceScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.mainContentContainer}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={ServiceNames}
        renderItem={({item}) => (
          <Button
            key={item.id}
            title={item}
            onPress={() => navigation.navigate(item)}
          />
        )}
      />
      <HermesAnnounce />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContentContainer: {flex: 1},
});
