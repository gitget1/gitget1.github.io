// ✅ AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import AuthStackNavigator from './stack/AuthStackNavigator';
import FunctionStackNavigator from './stack/FunctionStackNavigator';
import QuestionScreen from '../screens/mbti/QuestionScreen';
import Make_program from '../screens/program/Make_program';

export type AppStackParamList = {
  AuthStack: undefined;
  Main: undefined;
  FunctionStack: undefined;
  QuestionScreen: undefined;
  MakeProgram: undefined;
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
      <Stack.Screen name="FunctionStack" component={FunctionStackNavigator} />
      <Stack.Screen
        name="QuestionScreen"
        component={QuestionScreen}
        options={{
          headerShown: true,
          title: 'MBTI 테스트',
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="MakeProgram"
        component={Make_program}
        options={{
          headerShown: true,
          title: '프로그램 작성하기',
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;