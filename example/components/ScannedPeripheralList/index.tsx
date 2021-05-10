import React, {useMemo} from 'react';
import {Text, FlatList} from 'react-native';
import {List} from 'react-native-paper';
import {PeripheralInfo, State} from 'bluevery';
import {Item} from './Item';

type Props = {
  peripheralsMap: State['scannedPeripherals'];
  onPress: (peripheralInfo: PeripheralInfo) => Promise<void>;
};

export const ScannedPeripheralList: React.VFC<Props> = ({
  peripheralsMap,
  onPress,
}) => {
  const peripherals = useMemo(() => Object.values(peripheralsMap), [
    peripheralsMap,
  ]);

  return (
    <List.Section>
      <List.Subheader>Scanned Peripherals</List.Subheader>
      <FlatList
        ListEmptyComponent={() => <Text>no list</Text>}
        data={peripherals}
        renderItem={({item}) =>
          item ? (
            <Item key={item.id} peripheralInfo={item} onPress={onPress} />
          ) : null
        }
      />
    </List.Section>
  );
};
