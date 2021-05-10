import React, {useCallback} from 'react';
import {} from 'react-native';
import {Snackbar} from 'react-native-paper';

declare const global: {HermesInternal: null | {}};
type Props = {};

export const HermesAnnounce: React.VFC<Props> = () => {
  const [visible, setVisible] = React.useState(true);

  const onDismissSnackBar = useCallback(() => setVisible(false), []);

  return (
    <Snackbar
      visible={visible && global.HermesInternal != null}
      onDismiss={onDismissSnackBar}
      action={{
        label: 'X',
        onPress: () => {
          setVisible(false);
        },
      }}>
      Engine: Hermes
    </Snackbar>
  );
};
