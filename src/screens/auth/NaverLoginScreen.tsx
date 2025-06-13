import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';

// 백엔드 URL 설정
const backendUrl = 'http://124.60.137.10:80';

const App = () => {
  console.log('start');
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const navigation = useNavigation();

  // getTokenByCode 함수를 useCallback으로 감싸서 메모이제이션
  const getTokenByCode = useCallback(
    async code => {
      try {
        const response = await axios.get(
          `${backendUrl}/auth/token?code=${code}`,
          {
            withCredentials: true,
          },
        );

        const accessToken = response.headers.authorization.replace(
          'Bearer ',
          '',
        );

        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
          navigation.replace('Main');
        }
      } catch (error) {
        console.error('토큰 요청 실패:', error);
        Alert.alert('로그인 실패', '토큰을 받을 수 없습니다.');
      }
    },
    [navigation],
  );

  useEffect(() => {
    const getInitialLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      console.log('딥링크 감지됨:', initialUrl);

      if (initialUrl && initialUrl.startsWith('travellocal://login/callback')) {
        const code = extractCodeFromUrl(initialUrl);
        if (code) {
          console.log('추출된 authCode:', code);
          getTokenByCode(code);
        }
      } else {
        checkAndRefreshToken(); // 일반적인 재발급 흐름
      }
    };

    getInitialLink();

    // 앱이 백그라운드 → 포그라운드로 전환될 때도 딥링크 처리
    const subscription = Linking.addEventListener('url', ({url}) => {
      console.log('앱 재활성화로 URL 감지됨:', url);
      if (url && url.startsWith('travellocal://login/callback')) {
        const code = extractCodeFromUrl(url);
        if (code) {
          getTokenByCode(code);
        }
      }
    });

    return () => subscription.remove();
  }, [getTokenByCode]);

  // URLSearchParams 대신 직접 파싱
  const extractCodeFromUrl = url => {
    const queryString = url.split('?')[1];
    if (!queryString) {
      return null;
    }
    const params = queryString.split('&');
    for (let param of params) {
      const [key, value] = param.split('=');
      if (key === 'code') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  // reissue로 토큰 재발급
  const checkAndRefreshToken = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        const response = await axios.post(
          `${backendUrl}/reissue`,
          {},
          {withCredentials: true},
        );
        const newAccessToken = response.headers.authorization;
        console.log('재발급된 accessToken:', newAccessToken);
        if (newAccessToken) {
          await AsyncStorage.setItem('accessToken', newAccessToken);
        }
      }
    } catch (error) {
      console.error('reissue 실패:', error);
    }
  };

  const onNaverLogin = () => {
    setIsWebViewVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OAuth2 네이버 로그인</Text>
      <TouchableOpacity style={styles.button} onPress={onNaverLogin}>
        <Text style={styles.buttonText}>NAVER LOGIN</Text>
      </TouchableOpacity>

      <Modal
        visible={isWebViewVisible}
        onRequestClose={() => setIsWebViewVisible(false)}>
        <View style={styles.webViewContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsWebViewVisible(false)}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
          <WebView
            source={{uri: `${backendUrl}/oauth2/authorization/naver`}}
            style={styles.webView}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 20, marginBottom: 20},
  button: {padding: 15, backgroundColor: 'blue', borderRadius: 5},
  buttonText: {color: 'white', fontSize: 16},
  webViewContainer: {flex: 1},
  webView: {flex: 1},
  closeButton: {
    padding: 10,
    backgroundColor: 'lightgray',
    alignItems: 'center',
  },
  closeButtonText: {fontSize: 16},
});

export default App;
