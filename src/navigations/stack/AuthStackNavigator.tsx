import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AuthHomeScreen from '../../screens/auth/AuthHomeScreen';
import LoginScreen from '../../screens/auth/LoginScreen';
import { authNavigations } from '../../constants';
import KaKaoLoginScreen from '../../screens/auth/KaKaoLoginScreen';
import NaverLoginScreen from '../../screens/auth/NaverLoginScreen';
import GoogleLoginScreen from '../../screens/auth/GoogleLoginScreen';
import MainHomeScreen from '../../screens/auth/MainHomeScreen';

export type AuthStackParamList = {
  [authNavigations.AUTH_HOME]: undefined;
  [authNavigations.Login]: undefined;
  [authNavigations.SIGNUP]: undefined;
  [authNavigations.KAKAO]: undefined;
  [authNavigations.NAVER]: undefined;
  [authNavigations.GOOGLE]: undefined;
  [authNavigations.HOME]: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

type AuthStackNavigatorProps = {
  navigationOverride?: () => void;
};

function AuthStackNavigator({ navigationOverride }: AuthStackNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyle: {
          backgroundColor: 'white',
        },
        headerStyle: {
          backgroundColor: 'white',
          shadowColor: 'gray',
        },
        headerTitleStyle: {
          fontSize: 15,
        },
        headerTintColor: 'black',
      }}>
      <Stack.Screen
        name={authNavigations.AUTH_HOME}
        options={{ headerTitle: ' ', headerShown: false }}
      >
        {props => (
          <AuthHomeScreen
            {...props}
            navigationOverride={navigationOverride}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name={authNavigations.Login}
        component={LoginScreen}
        options={{ headerTitle: '로그인' }}
      />

      <Stack.Screen
        name={authNavigations.KAKAO}
        component={KaKaoLoginScreen}
        options={{ headerTitle: '카카오 로그인' }}
      />

      <Stack.Screen
        name={authNavigations.NAVER}
        component={NaverLoginScreen}
        options={{ headerTitle: '네이버 로그인' }}
      />

      <Stack.Screen
        name={authNavigations.GOOGLE}
        component={GoogleLoginScreen}
        options={{ headerTitle: '구글 로그인' }}
      />

      <Stack.Screen
        name={authNavigations.HOME}
        component={MainHomeScreen}
        options={{
          headerTitle: 'TravelLocal',
          headerTitleStyle: {
            fontSize: 24,
          },
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});

export default AuthStackNavigator;
