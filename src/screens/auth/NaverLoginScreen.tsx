// NaverLoginScreen.js (또는 App.js 라고 이름 붙여뒀던 거)
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';

const backendUrl = 'http://124.60.137.10:8083';

const NaverLoginScreen = () => {
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const navigation = useNavigation();

  // ✅ 코드로 accessToken 받기
  const getTokenByCode = useCallback(
    async (code) => {
      try {
        console.log('🔄 네이버 로그인 - 코드로 토큰 요청:', code);
        
        const response = await axios.get(
          `${backendUrl}/auth/token?code=${code}`,
          { withCredentials: true }
        );

<<<<<<< Updated upstream
        console.log('📡 네이버 로그인 - 서버 응답:', response.status);
        console.log('📡 네이버 로그인 - 응답 헤더:', response.headers);

        const accessToken = response.headers.authorization?.replace('Bearer ', '');
        console.log('🔑 네이버 로그인 - 받은 토큰:', accessToken);
        
        // JWT 토큰 디코딩 (디버깅용)
        if (accessToken) {
          try {
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('🔍 네이버 로그인 - JWT 페이로드:', payload);
            }
          } catch (e) {
            console.log('⚠️ JWT 디코딩 실패:', e.message);
          }
        }
        
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          console.log('✅ 네이버 로그인 - 토큰 저장 완료');
=======
        const accessToken = response.headers.authorization?.replace('Bearer ', '');
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
>>>>>>> Stashed changes
          navigation.replace('Main');
        } else {
          console.log('❌ 네이버 로그인 - 토큰이 없습니다');
        }
      } catch (error) {
        Alert.alert('로그인 실패', '토큰을 받을 수 없습니다.');
      }
    },
    [navigation]
  );

  const extractCodeFromUrl = (url) => {
    const queryString = url.split('?')[1];
    if (!queryString) return null;
    const params = queryString.split('&');
    for (let param of params) {
      const [key, value] = param.split('=');
      if (key === 'code') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const handleOAuthCallback = useCallback(
    (url) => {
      const code = extractCodeFromUrl(url);
      if (code) {
        getTokenByCode(code);
      }
      setIsWebViewVisible(false);
    },
    [getTokenByCode]
  );

  useEffect(() => {
    // ✅ 화면 진입 시 바로 WebView 띄움
    setIsWebViewVisible(true);

    const getInitialLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.startsWith('travellocal://login/callback')) {
        handleOAuthCallback(initialUrl);
      } else {
        checkAndRefreshToken();
      }
    };

    getInitialLink();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && url.startsWith('travellocal://login/callback')) {
        handleOAuthCallback(url);
      }
    });

    return () => subscription.remove();
  }, [handleOAuthCallback]);

  const checkAndRefreshToken = useCallback(async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log('🔍 네이버 로그인 - 기존 토큰 확인:', accessToken ? '토큰 존재' : '토큰 없음');
      
      if (!accessToken) {
        console.log('🔄 네이버 로그인 - 토큰 재발급 요청');
        const response = await axios.post(
          `${backendUrl}/reissue`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = response.headers.authorization;
<<<<<<< Updated upstream
        console.log('🔑 네이버 로그인 - 재발급된 토큰:', newAccessToken);
        
=======
>>>>>>> Stashed changes
        if (newAccessToken) {
          await AsyncStorage.setItem('accessToken', newAccessToken);
          console.log('✅ 네이버 로그인 - 재발급 토큰 저장 완료');
        }
      }
    } catch (error) {
      // 토큰 재발급 실패 시 무시
    }
  }, []);

  return (
    <View style={styles.container}>
      <Modal
        visible={isWebViewVisible}
        onRequestClose={() => setIsWebViewVisible(false)}>
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: `${backendUrl}/oauth2/authorization/naver` }}
            style={styles.webView}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
});

export default NaverLoginScreen;