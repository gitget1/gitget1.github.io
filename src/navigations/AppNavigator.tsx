// ✅ AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from '../screens/auth/BottomTabNavigator';
import AuthStackNavigator from './stack/AuthStackNavigator';

export type AppStackParamList = {
  AuthStack: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="AuthStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="AuthStack"
        children={({ navigation }) => (
          <AuthStackNavigator
            navigationOverride={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            }
          />
        )}
      />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;