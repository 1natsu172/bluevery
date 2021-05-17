import React from 'react';
import {Button, Card, Text} from 'react-native-paper';
import {PeripheralInfo} from 'bluevery';
import {StyleSheet} from 'react-native';

type Props = {
  peripheralInfo: PeripheralInfo;
  characteristicValues: unknown[] | undefined;
  receiveCharateristicValue?: {
    name: string;
    onReceiveCharacteristicValue: (
      peripheralInfo: PeripheralInfo,
    ) => Promise<void>;
  };
};

export const Item: React.VFC<Props> = ({
  peripheralInfo,
  characteristicValues,
  receiveCharateristicValue,
}) => {
  const {
    id,
    name,
    connect,
    bonded,
    communicate,
    retrieveServices,
    receivingForCharacteristicValue,
  } = peripheralInfo;

  return (
    <Card style={styles.cardWrapper}>
      <Card.Title title={name} subtitle={id} />
      <Card.Content>
        <Text>connect: {connect}</Text>
        <Text>bonded:{bonded}</Text>
        <Text>communicate: {communicate}</Text>
        <Text>retreieve:{retrieveServices}</Text>
        <Text>receiving:{receivingForCharacteristicValue}</Text>
        <Text>characteristicValues:{JSON.stringify(characteristicValues)}</Text>
      </Card.Content>
      {receiveCharateristicValue ? (
        <Card.Actions>
          <Button
            onPress={() =>
              receiveCharateristicValue.onReceiveCharacteristicValue(
                peripheralInfo,
              )
            }>
            Receive from {receiveCharateristicValue.name}
          </Button>
        </Card.Actions>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  actions: {
    justifyContent: 'flex-end',
  },
});
