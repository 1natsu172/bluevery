import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ErrorBoundary, FallbackProps} from 'react-error-boundary';
import App from './App';

type Props = {};

const ErrorFallback: React.VFC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <View>
      <Text>Something went wrong:</Text>
      <Text>{error.message}</Text>
      <TouchableOpacity onPress={resetErrorBoundary}>
        Try again
      </TouchableOpacity>
    </View>
  );
};

export function AppContainer(_props: Props) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  );
}
