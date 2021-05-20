import React from 'react';
import {StyleSheet} from 'react-native';
import {Appbar} from 'react-native-paper';

type Props = {};

export const Header: React.VFC<Props> = () => {
  return (
    <Appbar.Header>
      <Appbar.Content
        title="Welcome to Bluevery"
        titleStyle={styles.title}
        subtitle={'example app'}
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  title: {},
});
