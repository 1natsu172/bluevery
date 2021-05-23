import React, {useCallback} from 'react';
import {Card, Button, Caption} from 'react-native-paper';
import {PeripheralInfo} from 'bluevery';
import {StyleSheet} from 'react-native';

type Props = {
  peripheralInfo: PeripheralInfo;
  onConnect: (peripheralInfo: PeripheralInfo) => Promise<void>;
};

export const Item: React.VFC<Props> = ({peripheralInfo, onConnect}) => {
  const {id, name, advertising, rssi} = peripheralInfo;

  const _onConnect = useCallback(async () => {
    await onConnect(peripheralInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card style={styles.cardWrapper}>
      <Card.Title
        title={name}
        subtitle={id}
        right={() => <Button onPress={_onConnect}>Connect</Button>}
      />
      <Card.Content>
        <Caption>RSSI: {rssi}</Caption>
        {Object.entries(advertising).map(([key, value]) => (
          <Caption key={key}>
            {key}: {JSON.stringify(value)}
          </Caption>
        ))}
      </Card.Content>
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
