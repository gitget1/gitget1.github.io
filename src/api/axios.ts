import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const baseURL =
  Platform.OS === 'android'
    ? 'http://124.60.137.10:80'
    : 'http://124.60.137.10:80';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 네이버 로그인 화면으로 이동
      // navigation.navigate('AuthStack');
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
