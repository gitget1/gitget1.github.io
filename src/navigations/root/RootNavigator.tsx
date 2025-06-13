// import AuthStackNavigator from "../stack/AuthStackNavigator";
// import MainDrawerNavigator from "../drawer/MainDrawerNavigator";
// // import useAuth from "../../hooks/queries/useAuth";

// function RootNavigator() {
//   const {isLogin} = useAuth();

//   return <>{isLogin ? <MainDrawerNavigator />: <AuthStackNavigator />}</>; /* 로그인 상태에 따라 main  */
// }

// export default RootNavigator
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';

// 스크린 import
import MainScreen from '../../screens/mypage/MyPage';
import QuestionScreen from '../../screens/mbti/QuestionScreen';
import ResultScreen from '../../screens/mbti/ResultScreen';
import Make_program from '../../screens/program/Make_program';
import Practice from '../../screens/auth/Practice';
import MainHomeScreen from '../../screens/auth/MainHomeScreen';

// 스택 네비게이터 타입 정의
export type RootStackParamList = {
  MainHome: undefined;
  Test: undefined;
  TourByPreference: undefined;
  TourByRegion: undefined;
  TodayRecommendation: undefined;
  MyPage: undefined;
  QuestionScreen: undefined;
  Result: {result: any};
  MakeProgram: undefined;
  Practice: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MyPage">
        <Stack.Screen
          name="MyPage"
          component={MainScreen}
          options={{title: '마이페이지'}}
        />
        <Stack.Screen
          name="QuestionScreen"
          component={QuestionScreen}
          options={{title: '성향 테스트'}}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{title: '테스트 결과'}}
        />
        <Stack.Screen
          name="MakeProgram"
          component={Make_program}
          options={{title: '프로그램 작성하기'}}
        />
        <Stack.Screen
          name="Practice"
          component={Practice}
          options={{title: '지역 설정'}}
        />
        <Stack.Screen name="MainHome" component={MainHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
