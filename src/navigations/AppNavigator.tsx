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
import Practice1 from '../screens/practice/Practice_detail page';
import MyReviewList from '../screens/mypage/MyReviewList';
import PaymentScreen from '../screens/payment/PaymentScreen';
import PaymentCompleteScreen from '../screens/payment/PaymentCompleteScreen';
import TestPost from '../screens/practice/test_post';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

export type AppStackParamList = {
  AuthStack: undefined;
  Main: undefined;
  FunctionStack: {
    screen: 'Test' | 'TourByPreference' | 'TourByRegion' | 'TodayRecommend';
  };
  QuestionScreen: undefined;
  Make_program: {
    editData?: {
      title: string;
      description: string;
      guidePrice: number;
      region: string;
      thumbnailUrl: string;
      hashtags: string[];
      schedules: Array<{
        day: number;
        scheduleSequence: number;
        placeName: string;
        lat: number;
        lon: number;
        placeDescription: string;
        travelTime: number;
      }>;
    };
    tourProgramId?: string;
  };
  TraitSelection: undefined;
  Result: {
    result: any;
  };
  Practice: undefined;
  MyReviewList: undefined;
  PaymentScreen: undefined;
  PaymentComplete: undefined;
  TestPost: undefined;
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
        name="PracticeDetail"
        component={Practice1}
        options={{
          headerShown: true,
          title: '투어 상세',
          headerTitleStyle: {fontSize: 20},
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
          title: '리뷰',
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="Make_program"
        component={Make_program}
        options={{
          headerShown: true,
          title: '프로그램 작성하기',
          headerTitleStyle: {
            fontSize: 20,
          },
        }}
      />
      <Stack.Screen
        name="MyReviewList"
        component={MyReviewList}
        options={{
          headerShown: true,
          title: '내가 쓴 리뷰',
          headerTitleStyle: {fontSize: 20},
        }}
      />
      <Stack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
        options={{
          headerShown: true,
          title: '결제',
          headerTitleStyle: {fontSize: 20},
        }}
      />
      <Stack.Screen
        name="PaymentComplete"
        component={PaymentCompleteScreen}
        options={{
          headerShown: true,
          title: '결제 완료',
          headerTitleStyle: {fontSize: 20},
        }}
      />
      <Stack.Screen
        name="TestPost"
        component={TestPost}
        options={{
          title: '투어 등록 테스트',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
