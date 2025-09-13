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

const GoogleLoginScreen = () => {
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const navigation = useNavigation();

  // ✅ 코드로 accessToken 받기
  const getTokenByCode = useCallback(
    async (code) => {
      try {
        const response = await axios.get(
          `${backendUrl}/auth/token?code=${code}`,
          { withCredentials: true }
        );

        const accessToken = response.headers.authorization?.replace('Bearer ', '');
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          navigation.replace('Main');
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
      if (!accessToken) {
        const response = await axios.post(
          `${backendUrl}/reissue`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = response.headers.authorization;
        if (newAccessToken) {
          await AsyncStorage.setItem('accessToken', newAccessToken);
        }
      }
    } catch (error) {
      console.error('reissue 실패:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Modal
        visible={isWebViewVisible}
        onRequestClose={() => setIsWebViewVisible(false)}>
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: `${backendUrl}/oauth2/authorization/google` }}
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

export default GoogleLoginScreen;
