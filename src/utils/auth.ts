import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';

/**
 * 로그인 상태를 확인하는 함수
 * @returns {Promise<boolean>} 로그인 여부
 */
export const checkLoginStatus = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token && token.trim() !== '';
  } catch (error) {
    return false;
  }
};

/**
 * 로그인이 필요한 기능에 접근할 때 사용하는 함수
 * @param navigation - 네비게이션 객체
 * @param message - 표시할 에러 메시지 (기본값: '로그인이 필요한 기능입니다.')
 */
export const requireLogin = (
  navigation: any,
  message: string = '로그인이 필요한 기능입니다.',
) => {
  Alert.alert('로그인 필요', message, [
    {
      text: '확인',
      onPress: () => {
        // 메인페이지로 이동 (MyPage)
        navigation.navigate('MyPage');
      },
    },
  ]);
};

/**
 * 로그인 상태를 확인하고 필요시 에러 메시지를 표시하는 함수
 * @param navigation - 네비게이션 객체
 * @param message - 표시할 에러 메시지
 * @returns {Promise<boolean>} 로그인 여부
 */
export const checkLoginAndShowAlert = async (
  navigation: any,
  message: string = '로그인이 필요한 기능입니다.',
): Promise<boolean> => {
  const isLoggedIn = await checkLoginStatus();

  if (!isLoggedIn) {
    requireLogin(navigation, message);
    return false;
  }

  return true;
};









