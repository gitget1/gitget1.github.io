import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Test from '../../screens/function/Test';
import TourByPreference from '../../screens/function/TourByPreference';
import TourByRegion from '../../screens/function/TourByRegion';
import TodayRecommend from '../../screens/function/TodayRecommend';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type FunctionStackParamList = {
  Test: undefined;
  TourByPreference: undefined;
  TourByRegion: undefined;
  TodayRecommend: undefined;
};

type RootStackParamList = {
  Main: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<FunctionStackParamList>();

const FunctionStackNavigator = () => {
  const rootNavigation = useNavigation<NavigationProp>();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
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
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => rootNavigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen
        name="Test"
        component={Test}
        options={{ title: '성향 테스트' }}
      />
      <Stack.Screen
        name="TourByPreference"
        component={TourByPreference}
        options={{ title: '성향 기반 관광' }}
      />
      <Stack.Screen
        name="TourByRegion"
        component={TourByRegion}
        options={{ title: '지역 기반 관광' }}
      />
      <Stack.Screen
        name="TodayRecommend"
        component={TodayRecommend}
        options={{ title: '오늘의 추천' }}
      />
    </Stack.Navigator>
  );
};

export default FunctionStackNavigator;

