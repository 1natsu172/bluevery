import React from 'react';
import {Text, FlatList, ScrollView, RefreshControl} from 'react-native';
import {List} from 'react-native-paper';
import {PeripheralInfo, State} from 'bluevery';
import {Item} from './Item';

type Props = {
  peripheralsMap: State['scannedPeripherals'];
  onConnect: (peripheralInfo: PeripheralInfo) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export const ScannedPeripheralList: React.VFC<Props> = ({
  peripheralsMap,
  onConnect,
  onRefresh,
}) => {
  const peripherals = React.useMemo(() => Object.values(peripheralsMap), [
    peripheralsMap,
  ]);

  const [refreshing, setRefreshing] = React.useState(false);

  const _onRefresh = React.useCallback(() => {
    setRefreshing(true);
    onRefresh().then(() => setRefreshing(false));
  }, [onRefresh]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />
      }>
      <List.Section>
        <List.Subheader>Scanned Peripherals</List.Subheader>
        <FlatList
          ListEmptyComponent={() => <Text>no list</Text>}
          data={peripherals}
          renderItem={({item}) =>
            item ? (
              <Item key={item.id} peripheralInfo={item} onConnect={onConnect} />
            ) : null
          }
        />
      </List.Section>
    </ScrollView>
  );
};
