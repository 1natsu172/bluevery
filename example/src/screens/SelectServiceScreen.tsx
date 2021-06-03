import {useNavigation} from '@react-navigation/core';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Button,
  FlatList,
} from 'react-native';
import {HermesAnnounce} from '../components/HermesAnnounce';
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
        keyExtractor={(name, index) => name + index}
        renderItem={({item}) => (
          <Button
            key={item}
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
