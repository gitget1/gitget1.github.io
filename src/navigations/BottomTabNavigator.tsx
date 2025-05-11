import React from 'react';
import { Text } from 'react-native'; // ✅ 추가
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// 화면 컴포넌트들 import
import MainHomeScreen from '../screens/auth/MainHomeScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import Mypage from '../screens/mypage/MyPage';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === '홈') iconName = 'home';
          else if (route.name === '캘린더') iconName = 'calendar';
          else if (route.name === '마이페이지') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0288d1',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="TravelLocal"
        component={MainHomeScreen}
        options={{ tabBarLabel: () => <Text>홈</Text>, headerShown: false }} // ✅ 헤더 숨김
      />
      <Tab.Screen
        name="캘린더"
        component={CalendarScreen}
        options={{ tabBarLabel: () => <Text>캘린더</Text> }} // ✅ 수정
      />
      <Tab.Screen
        name="마이페이지"
        component={Mypage}
        options={{ tabBarLabel: () => <Text>마이페이지</Text> }} // ✅ 수정
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
