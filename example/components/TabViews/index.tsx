import React from 'react';
import {useWindowDimensions, StyleSheet} from 'react-native';
import {TabView, SceneMap, Route} from 'react-native-tab-view';

type Props = {
  scenes: ReturnType<typeof SceneMap>;
  routes: Route[];
};

export const TabViews: React.VFC<Props> = ({scenes, routes}) => {
  const [index, setIndex] = React.useState(0);
  const layout = useWindowDimensions();

  return (
    <TabView
      navigationState={{index, routes}}
      renderScene={scenes}
      onIndexChange={setIndex}
      initialLayout={{width: layout.width}}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});
