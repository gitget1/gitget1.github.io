import React from 'react';
import {Text} from 'react-native'; // ✅ 추가
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';

// 화면 컴포넌트들 import
import MainHomeScreen from '../screens/auth/MainHomeScreen';
import Mypage from '../screens/mypage/MyPage';
import WishlistScreen from '../screens/wishlist/WishlistScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const {t} = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Wishlist') iconName = 'heart';
          else if (route.name === 'MyPage') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0288d1',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="Home"
        component={MainHomeScreen}
        options={{
          tabBarLabel: () => <Text>{t('home')}</Text>,
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: () => <Text>{t('wishlist')}</Text>,
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="MyPage"
        component={Mypage}
        options={{tabBarLabel: () => <Text>{t('mypage')}</Text>}}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
