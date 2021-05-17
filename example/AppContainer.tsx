import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ErrorBoundary, FallbackProps} from 'react-error-boundary';
import {Provider as RNPaperProvider, DefaultTheme} from 'react-native-paper';
import App from './App';

type Props = {};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'tomato',
    accent: 'yellow',
  },
};

const ErrorFallback: React.VFC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <View>
      <Text>Something went wrong:</Text>
      <Text>{error.message}</Text>
      <TouchableOpacity onPress={resetErrorBoundary}>
        <Text>Try again</Text>
      </TouchableOpacity>
    </View>
  );
};

export function AppContainer(_props: Props) {
  return (
    <RNPaperProvider theme={theme}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
    </RNPaperProvider>
  );
}
