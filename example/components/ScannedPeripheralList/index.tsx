import React from 'react';
import {FlatList, RefreshControl, View, StyleSheet} from 'react-native';
import {ActivityIndicator, List, Text} from 'react-native-paper';
import {PeripheralInfo, State} from 'bluevery';
import {Item} from './Item';
import {useErrorHandler} from 'react-error-boundary';

type Props = {
  peripheralsMap: State['scannedPeripherals'];
  onConnect: (peripheralInfo: PeripheralInfo) => Promise<void>;
  onRefresh: () => Promise<void>;
  isScanning: boolean;
};

export const ScannedPeripheralList: React.VFC<Props> = ({
  peripheralsMap,
  onConnect,
  onRefresh,
  isScanning,
}) => {
  const handleError = useErrorHandler();
  const peripherals = React.useMemo(() => Object.values(peripheralsMap), [
    peripheralsMap,
  ]);

  const [refreshing, setRefreshing] = React.useState(false);

  const _onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
    try {
      await onRefresh();
    } catch (error) {
      handleError(error);
    }
  }, [handleError, onRefresh]);

  return (
    <>
      <View style={styles.listSubHeader}>
        <List.Subheader>Scanned Peripherals</List.Subheader>
        <ActivityIndicator animating={isScanning} size={16} />
      </View>
      <FlatList
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />
        }
        ListEmptyComponent={() => <Text>no list</Text>}
        data={peripherals}
        renderItem={({item}) =>
          item ? (
            <Item key={item.id} peripheralInfo={item} onConnect={onConnect} />
          ) : null
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  listSubHeader: {
    flexDirection: 'row',
  },
});
