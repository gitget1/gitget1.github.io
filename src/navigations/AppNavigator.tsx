// ✅ AppNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import AuthStackNavigator from './stack/AuthStackNavigator';
import FunctionStackNavigator from './stack/FunctionStackNavigator';
import QuestionScreen from '../screens/mbti/QuestionScreen';
import Make_program from '../screens/program/Make_program';
import TraitSelection from '../screens/Select_mbti/Trait_Selection';
import ResultScreen from '../screens/mbti/ResultScreen';
import Practice from '../screens/practice/Practice';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type AppStackParamList = {
  AuthStack: undefined;
  Main: undefined;
  FunctionStack: {
    screen: 'Test' | 'TourByPreference' | 'TourByRegion' | 'TodayRecommend';
  };
  QuestionScreen: undefined;
  MakeProgram: undefined;
  TraitSelection: undefined;
  Result: {
    result: any;
  };
  Practice: undefined;
};

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AuthStack"
      screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="AuthStack"
        children={({navigation}) => (
          <AuthStackNavigator
            navigationOverride={() =>
              navigation.reset({
                index: 0,
                routes: [{name: 'Main'}],
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
        name="TraitSelection"
        component={TraitSelection}
        options={{
          headerShown: true,
          title: '성향 선택',
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          headerShown: true,
          title: '테스트 결과',
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="Practice"
        component={Practice}
        options={{
          headerShown: true,
          title: '지역 설정',
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
