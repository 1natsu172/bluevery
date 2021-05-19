import React, {useCallback, useMemo} from 'react';
import {Text, FlatList} from 'react-native';
import {List} from 'react-native-paper';
import {PeripheralId, PeripheralInfo, State} from 'bluevery';
import {Item} from './Item';

type Props = {
  peripheralsMap: State['managingPeripherals'];
  characteristicValuesMap: {[key in PeripheralId]: unknown[] | undefined};
  receiveCharacteristicHandlersMap: {
    [key in PeripheralId]?: {
      name: string;
      onReceiveCharacteristicValue: (
        peripheralInfo: PeripheralInfo,
      ) => Promise<void>;
    };
  };
};

export const ManagingPeripheralList: React.VFC<Props> = ({
  peripheralsMap,
  characteristicValuesMap,
  receiveCharacteristicHandlersMap,
}) => {
  const peripherals = useMemo(() => Object.values(peripheralsMap), [
    peripheralsMap,
  ]);

  const getReceiveCharacteristicHandler = useCallback(
    (peripheralName: string | undefined) => {
      const detectedKey = Object.keys(
        receiveCharacteristicHandlersMap,
      ).find((key) => peripheralName?.includes(key));
      return detectedKey
        ? receiveCharacteristicHandlersMap[detectedKey]
        : undefined;
    },
    [receiveCharacteristicHandlersMap],
  );

  return (
    <>
      <List.Subheader>Managing Peripherals</List.Subheader>
      <FlatList
        ListEmptyComponent={() => <Text>no list</Text>}
        data={peripherals}
        renderItem={({item}) =>
          item ? (
            <Item
              key={item.id}
              peripheralInfo={item}
              characteristicValues={characteristicValuesMap[item.id]}
              receiveCharateristicValue={getReceiveCharacteristicHandler(
                item.name,
              )}
            />
          ) : null
        }
      />
    </>
  );
};
