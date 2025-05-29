import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, Platform} from 'react-native';
import {WebView} from 'react-native-webview';
import Config from 'react-native-config';
import axios from 'axios';

const REDIRECT_URI =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3030/auth/oauth/kakao'
    : 'http://localhost:3030/auth/oauth/kakao';

function KaKaoLoginScreen() {
  const [state] = useState(() => Math.random().toString(36).substring(2, 15));

  const handleOnNavigationStateChange = (navState: any) => {
    if (navState.url.includes(`${REDIRECT_URI}?code=`)) {
      const url = navState.url;
      const code = url.split('code=')[1]?.split('&')[0];
      const returnedState = url.split('state=')[1];

      if (code && returnedState === state) {
        requestToken(code);
      } else {
        console.error('Invalid state parameter');
      }
    }
  };

  const requestToken = async (code: string) => {
    try {
      const response = await axios({
        method: 'post',
        url: 'https://kauth.kakao.com/oauth/token',
        params: {
          grant_type: 'authorization_code',
          client_id: Config.KAKAO_REST_API_KEY,
          redirect_uri: REDIRECT_URI,
          code,
        },
      });
      console.log('response', response.data);
    } catch (error) {
      console.error('카카오 토큰 요청 실패:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{
          uri: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${Config.KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&state=${state}`,
        }}
        onNavigationStateChange={handleOnNavigationStateChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default KaKaoLoginScreen;
