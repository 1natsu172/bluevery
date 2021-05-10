import React, {useCallback} from 'react';
import {Card, Button} from 'react-native-paper';
import {PeripheralInfo} from 'bluevery';
import {View, Text, StyleSheet} from 'react-native';

type Props = {
  peripheralInfo: PeripheralInfo;
  onPress: (peripheralInfo: PeripheralInfo) => Promise<void>;
};

// const Connect = () => {
//   return (
//     <View>
//       <Text>Connect</Text>
//     </View>
//   );
// };

export const Item: React.VFC<Props> = ({peripheralInfo, onPress}) => {
  const {id, name} = peripheralInfo;

  const _onPress = useCallback(async () => {
    await onPress(peripheralInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // <List.Item
    //   title={name}
    //   description={id}
    //   onPress={_onPress}
    //   titleEllipsizeMode={'middle'}
    //   titleNumberOfLines={2}
    //   right={() => <Connect />}
    // />
    <Card>
      <Card.Content>
        <Card.Title title={name} subtitle={id} />
        <Card.Actions style={styles.actions}>
          <Button onPress={_onPress}>Connect</Button>
        </Card.Actions>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  actions: {
    justifyContent: 'flex-end',
  },
});
