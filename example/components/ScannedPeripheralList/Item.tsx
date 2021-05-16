import React, {useCallback} from 'react';
import {Card, Button} from 'react-native-paper';
import {PeripheralInfo} from 'bluevery';
import {StyleSheet} from 'react-native';

type Props = {
  peripheralInfo: PeripheralInfo;
  onPress: (peripheralInfo: PeripheralInfo) => Promise<void>;
};

export const Item: React.VFC<Props> = ({peripheralInfo, onPress}) => {
  const {id, name} = peripheralInfo;

  const _onPress = useCallback(async () => {
    await onPress(peripheralInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card style={styles.cardWrapper}>
      <Card.Content>
        <Card.Title
          title={name}
          subtitle={id}
          right={() => <Button onPress={_onPress}>Connect</Button>}
        />
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
