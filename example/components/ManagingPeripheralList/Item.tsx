import React from 'react';
import {Button, Card, Caption} from 'react-native-paper';
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
    advertising,
    rssi,
  } = peripheralInfo;

  return (
    <Card style={styles.cardWrapper}>
      <Card.Title title={name} subtitle={id} />
      <Card.Content>
        <Caption>
          serviceUUID: {JSON.stringify(advertising.serviceUUIDs)}
        </Caption>
        <Caption>RSSI: {rssi}</Caption>
        <Caption>connect: {connect}</Caption>
        <Caption>bonded:{bonded}</Caption>
        <Caption>communicate: {communicate}</Caption>
        <Caption>retreieve:{retrieveServices}</Caption>
        <Caption>receiving:{receivingForCharacteristicValue}</Caption>
        <Caption>
          characteristicValues:{JSON.stringify(characteristicValues)}
        </Caption>
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
      ) : (
        <Card.Content children={null} />
      )}
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
