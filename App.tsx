import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigations/root/RootNavigator';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './src/api/queryClient';



function App() {
 


  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator/>
      </NavigationContainer>
    </QueryClientProvider>
  );
}



export default App;